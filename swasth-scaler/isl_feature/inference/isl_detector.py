"""
isl_detector.py
───────────────────────────────────────────────────────────────────────────────
ISL symptom recognition detector — backend inference module.

Loaded by backend/main.py via:
    from isl_detector import ISLDetector
    detector = ISLDetector()
    result = detector.process_frame(cv2_bgr_frame)

Signs (class_id → label):
    0  DARD         (Pain)              HIGH urgency
    1  BUKHAR       (Fever)             HIGH urgency
    2  SAR-DARD     (Headache)          MEDIUM urgency
    3  PET-DARD     (Stomach Pain)      HIGH urgency
    4  ULTI         (Vomiting/Nausea)   MEDIUM urgency
    5  KHANSI       (Cough)             MEDIUM urgency
    6  SANS-TAKLEEF (Breathlessness)    CRITICAL urgency  ← escalate on 1st frame
    7  SEENE-DARD   (Chest Pain)        CRITICAL urgency  ← escalate on 1st frame
    8  CHAKKAR      (Dizziness)         MEDIUM urgency
    9  KAMZORI      (Weakness/Fatigue)  MEDIUM urgency
   10  UNKNOWN      (reserved)

Training data format:
    Each sample = flat list of 63 floats = 21 MediaPipe hand landmarks × (x, y, z)
    Normalised: wrist-centred, scaled by wrist→middle-MCP distance.

Runtime rules (from master training prompt §8):
    - Rolling 60-frame window, classify every 100ms (10fps)
    - CRITICAL signs: output on FIRST qualifying frame, no voting required
    - Non-critical: require VOTE_FRAMES consecutive same-class frames ≥ threshold
    - GDPR/DPDP Act 2023: no raw video stored; only landmark tensors

Anti-hallucination rules (from anti-hallucination system prompt):
    - confidence < per-class threshold → return UNKNOWN
    - SEENE-DARD + SANS-TAKLEEF detected in sequence → CARDIAC_EMERGENCY flag
    - confidence capped — scores > 0.95 flagged as suspect
───────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
import os
import time
from collections import deque
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)

# ── Label config ──────────────────────────────────────────────────────────────
LABELS = [
    "DARD",          # 0
    "BUKHAR",        # 1
    "SAR-DARD",      # 2
    "PET-DARD",      # 3
    "ULTI",          # 4
    "KHANSI",        # 5
    "SANS-TAKLEEF",  # 6 — CRITICAL
    "SEENE-DARD",    # 7 — CRITICAL
    "CHAKKAR",       # 8
    "KAMZORI",       # 9
    "UNKNOWN",       # 10 — reserved
]

# Per-class minimum confidence thresholds (from isl_sign_data.json)
CONFIDENCE_THRESHOLDS: dict[str, float] = {
    "DARD":          0.78,
    "BUKHAR":        0.82,
    "SAR-DARD":      0.80,
    "PET-DARD":      0.76,
    "ULTI":          0.84,
    "KHANSI":        0.88,
    "SANS-TAKLEEF":  0.85,
    "SEENE-DARD":    0.86,
    "CHAKKAR":       0.79,
    "KAMZORI":       0.75,
    "UNKNOWN":       0.0,
}

# Urgency escalation thresholds (from anti-hallucination prompt)
ESCALATE_THRESHOLDS: dict[str, float] = {
    "SANS-TAKLEEF": 0.60,
    "SEENE-DARD":   0.60,
    "DARD":         0.70,
    "BUKHAR":       0.70,
    "PET-DARD":     0.70,
}

URGENCY: dict[str, str] = {
    "DARD":          "high",
    "BUKHAR":        "high",
    "SAR-DARD":      "medium",
    "PET-DARD":      "high",
    "ULTI":          "medium",
    "KHANSI":        "medium",
    "SANS-TAKLEEF":  "critical",
    "SEENE-DARD":    "critical",
    "CHAKKAR":       "medium",
    "KAMZORI":       "medium",
    "UNKNOWN":       "unknown",
}

HINDI_LABELS: dict[str, str] = {
    "DARD":          "दर्द",
    "BUKHAR":        "बुखार",
    "SAR-DARD":      "सर दर्द",
    "PET-DARD":      "पेट दर्द",
    "ULTI":          "उल्टी",
    "KHANSI":        "खाँसी",
    "SANS-TAKLEEF":  "सांस तकलीफ",
    "SEENE-DARD":    "सीने में दर्द",
    "CHAKKAR":       "चक्कर",
    "KAMZORI":       "कमज़ोरी",
    "UNKNOWN":       "",
}

CRITICAL_SIGNS = {"SANS-TAKLEEF", "SEENE-DARD"}
VOTE_FRAMES    = 5     # non-critical: require this many consecutive agreeing frames
WINDOW_SIZE    = 60    # rolling history window (frames)
CARDIAC_COMBO_WINDOW_S = 10.0  # seconds within which SEENE-DARD + SANS-TAKLEEF triggers CARDIAC_EMERGENCY


# ── Normalisation (matches frontend normalize.js exactly) ─────────────────────
def _normalize(landmarks: list) -> np.ndarray:
    """
    Wrist-centred, scale-invariant normalisation.
    landmarks: list of 21 dicts with x, y, z keys (MediaPipe format).
    Returns float32 array of shape (63,).
    """
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    wrist = pts[0]
    ref   = pts[9]  # middle-finger MCP
    scale = float(np.linalg.norm(ref - wrist)) or 1.0
    normed = (pts - wrist) / scale
    return normed.flatten()  # (63,)


# ── ISLDetector ───────────────────────────────────────────────────────────────
class ISLDetector:
    """
    Stateful, frame-by-frame ISL symptom detector.

    Usage:
        detector = ISLDetector()
        result   = detector.process_frame(cv2_bgr_frame)
        detector.close()
    """

    def __init__(self, model_path: Optional[str] = None):
        # ── MediaPipe Hands ───────────────────────────────────────────────────
        self._mp_hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.70,
            min_tracking_confidence=0.60,
        )

        # ── Keras model ───────────────────────────────────────────────────────
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__),
                "..", "..", "frontend", "isl_model.h5"
            )
        self._model = None
        if os.path.exists(model_path):
            try:
                import tensorflow as tf
                self._model = tf.keras.models.load_model(model_path)
                # warm-up
                self._model.predict(np.zeros((1, 63), dtype=np.float32), verbose=0)
                logger.info(f"[ISLDetector] model loaded from {model_path}")
            except Exception as e:
                logger.error(f"[ISLDetector] model load failed: {e}")
        else:
            logger.warning(f"[ISLDetector] model not found at {model_path} — running landmark-only mode")

        # ── State ─────────────────────────────────────────────────────────────
        self._vote_buffer: deque[str] = deque(maxlen=VOTE_FRAMES)
        self._history: deque[str]     = deque(maxlen=WINDOW_SIZE)
        self._fill: float             = 0.0
        self._last_confirmed: Optional[str] = None
        self._critical_timestamps: dict[str, float] = {}

    # ── Public API ────────────────────────────────────────────────────────────
    def process_frame(self, bgr_frame: np.ndarray) -> dict:
        """
        Process one BGR frame.

        Returns dict:
            sign            str | None
            english         str | None
            hindi           str | None
            icd10           str | None
            urgency         str
            confidence      float
            confirmed       bool
            escalate        bool
            fill            float  (0–1, lock progress for non-critical)
            has_hand        bool
            cardiac_emergency bool
            all_confidences dict[str, float]
            model_notes     str
        """
        now = time.time()

        # ── Run MediaPipe ─────────────────────────────────────────────────────
        rgb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        results = self._mp_hands.process(rgb)

        if not results.multi_hand_landmarks:
            self._vote_buffer.clear()
            self._fill = max(0.0, self._fill - 0.15)
            return self._no_hand_result()

        lm = results.multi_hand_landmarks[0].landmark
        features = _normalize(lm)

        # ── Run model ─────────────────────────────────────────────────────────
        if self._model is None:
            return {
                **self._base_result(),
                "has_hand": True,
                "model_notes": "Model not loaded — landmark-only mode",
            }

        raw_scores = self._model.predict(
            features.reshape(1, 63), verbose=0
        )[0].tolist()

        all_confidences = {LABELS[i]: round(raw_scores[i], 4) for i in range(len(LABELS))}

        best_idx  = int(np.argmax(raw_scores))
        best_conf = float(raw_scores[best_idx])
        best_lbl  = LABELS[best_idx]

        # Anti-hallucination: cap suspiciously high confidence
        notes = ""
        if best_conf > 0.95:
            notes = "High confidence flagged — verify model calibration"
            best_conf = 0.95

        # Apply per-class threshold — fall back to UNKNOWN
        threshold = CONFIDENCE_THRESHOLDS.get(best_lbl, 0.80)
        if best_conf < threshold:
            best_lbl  = "UNKNOWN"
            best_conf = max(raw_scores)

        if best_lbl == "UNKNOWN":
            self._vote_buffer.clear()
            self._fill = 0.0
            return {
                **self._base_result(),
                "has_hand": True,
                "all_confidences": all_confidences,
                "model_notes": notes or "Below confidence threshold",
            }

        # ── CRITICAL signs: output immediately ───────────────────────────────
        if best_lbl in CRITICAL_SIGNS:
            escalate_thresh = ESCALATE_THRESHOLDS.get(best_lbl, 0.60)
            escalate = best_conf >= escalate_thresh

            self._critical_timestamps[best_lbl] = now
            cardiac_emergency = self._check_cardiac_emergency(now)

            self._history.append(best_lbl)
            self._fill = 1.0
            self._last_confirmed = best_lbl

            return {
                "sign":              best_lbl,
                "english":           best_lbl.replace("-", " ").title(),
                "hindi":             HINDI_LABELS.get(best_lbl),
                "icd10":             self._icd10(best_lbl),
                "urgency":           URGENCY.get(best_lbl, "unknown"),
                "confidence":        round(best_conf, 4),
                "confirmed":         True,
                "escalate":          escalate,
                "fill":              1.0,
                "has_hand":          True,
                "cardiac_emergency": cardiac_emergency,
                "all_confidences":   all_confidences,
                "model_notes":       notes,
            }

        # ── Non-critical: require VOTE_FRAMES consecutive agreement ──────────
        self._vote_buffer.append(best_lbl)
        vote_count = sum(1 for v in self._vote_buffer if v == best_lbl)
        self._fill = vote_count / VOTE_FRAMES

        confirmed = (vote_count >= VOTE_FRAMES)
        if confirmed:
            self._last_confirmed = best_lbl
            self._history.append(best_lbl)

        escalate_thresh = ESCALATE_THRESHOLDS.get(best_lbl)
        escalate = escalate_thresh is not None and best_conf >= escalate_thresh

        return {
            "sign":              best_lbl if confirmed else None,
            "english":           best_lbl.replace("-", " ").title() if confirmed else None,
            "hindi":             HINDI_LABELS.get(best_lbl) if confirmed else None,
            "icd10":             self._icd10(best_lbl) if confirmed else None,
            "urgency":           URGENCY.get(best_lbl, "unknown"),
            "confidence":        round(best_conf, 4),
            "confirmed":         confirmed,
            "escalate":          escalate and confirmed,
            "fill":              round(self._fill, 3),
            "has_hand":          True,
            "cardiac_emergency": False,
            "all_confidences":   all_confidences,
            "model_notes":       notes,
        }

    def reset(self):
        """Reset voting state between patients."""
        self._vote_buffer.clear()
        self._fill = 0.0
        self._last_confirmed = None
        self._critical_timestamps.clear()
        logger.info("[ISLDetector] state reset")

    def close(self):
        self._mp_hands.close()
        logger.info("[ISLDetector] closed")

    # ── Internal helpers ──────────────────────────────────────────────────────
    def _check_cardiac_emergency(self, now: float) -> bool:
        """
        CARDIAC_EMERGENCY = SEENE-DARD + SANS-TAKLEEF both detected
        within CARDIAC_COMBO_WINDOW_S seconds of each other.
        """
        ts_seene = self._critical_timestamps.get("SEENE-DARD", 0.0)
        ts_sans  = self._critical_timestamps.get("SANS-TAKLEEF", 0.0)
        if ts_seene > 0 and ts_sans > 0:
            return abs(ts_seene - ts_sans) <= CARDIAC_COMBO_WINDOW_S
        return False

    @staticmethod
    def _icd10(label: str) -> Optional[str]:
        ICD = {
            "DARD":          "R52",
            "BUKHAR":        "R50.9",
            "SAR-DARD":      "R51",
            "PET-DARD":      "R10.9",
            "ULTI":          "R11.2",
            "KHANSI":        "R05.9",
            "SANS-TAKLEEF":  "R06.00",
            "SEENE-DARD":    "R07.9",
            "CHAKKAR":       "R42",
            "KAMZORI":       "R53.83",
        }
        return ICD.get(label)

    @staticmethod
    def _base_result() -> dict:
        return {
            "sign":              None,
            "english":           None,
            "hindi":             None,
            "icd10":             None,
            "urgency":           "unknown",
            "confidence":        0.0,
            "confirmed":         False,
            "escalate":          False,
            "fill":              0.0,
            "has_hand":          False,
            "cardiac_emergency": False,
            "all_confidences":   {},
            "model_notes":       "",
        }

    @staticmethod
    def _no_hand_result() -> dict:
        return {
            **ISLDetector._base_result(),
            "model_notes": "NO_HAND_DETECTED",
        }
