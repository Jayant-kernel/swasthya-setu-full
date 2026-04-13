"""
isl_detector.py — v2.0
───────────────────────────────────────────────────────────────────────────────
ISL symptom recognition backend — follows master training prompt v2.0.

Key changes from v1:
  • 12 classes: 10 signs + UNCERTAIN + NO_SIGN
  • Demographic-aware profiles (women / men / child / elderly) per §3A–D
  • Elderly tremor filter: EMA bandpass approximation
  • Rolling 60-frame window, 10fps classification (§8)
  • CRITICAL signs fire on FIRST qualifying frame (§8)
  • Non-critical: VOTE_FRAMES consecutive agreement
  • CARDIAC_EMERGENCY: SEENE-DARD + SANS-TAKLEEF within 10s
  • Per-class, per-demographic confidence thresholds
  • GDPR/DPDP Act 2023: no raw video stored; landmark tensors only

Signs:
  00 DARD          — Pain            HIGH
  01 BUKHAR        — Fever           HIGH
  02 SAR-DARD      — Headache        MEDIUM
  03 PET-DARD      — Stomach Pain    HIGH
  04 ULTI          — Vomiting        MEDIUM
  05 KHANSI        — Cough           MEDIUM
  06 SANS-TAKLEEF  — Breathlessness  CRITICAL  ← fire on first frame
  07 SEENE-DARD    — Chest Pain      CRITICAL  ← fire on first frame
  08 CHAKKAR       — Dizziness       MEDIUM
  09 KAMZORI       — Weakness        MEDIUM
  10 UNCERTAIN     — reserved
  11 NO_SIGN       — reserved
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

# ── Labels ────────────────────────────────────────────────────────────────────
LABELS = [
    "DARD",          # 00
    "BUKHAR",        # 01
    "SAR-DARD",      # 02
    "PET-DARD",      # 03
    "ULTI",          # 04
    "SANS-TAKLEEF",  # 05 — CRITICAL
    "SEENE-DARD",    # 06 — CRITICAL
    "CHAKKAR",       # 07
    "KAMZORI",       # 08
    "UNCERTAIN",     # 09 — reserved
    "NO_SIGN",       # 10 — reserved
]

CRITICAL_SIGNS = {"SANS-TAKLEEF", "SEENE-DARD"}

URGENCY: dict[str, str] = {
    "DARD":          "high",
    "BUKHAR":        "high",
    "SAR-DARD":      "medium",
    "PET-DARD":      "high",
    "ULTI":          "medium",
    "SANS-TAKLEEF":  "critical",
    "SEENE-DARD":    "critical",
    "CHAKKAR":       "medium",
    "KAMZORI":       "medium",
    "UNCERTAIN":     "unknown",
    "NO_SIGN":       "unknown",
}

HINDI_LABELS: dict[str, str] = {
    "DARD":          "दर्द",
    "BUKHAR":        "बुखार",
    "SAR-DARD":      "सर दर्द",
    "PET-DARD":      "पेट दर्द",
    "ULTI":          "उल्टी",
    "SANS-TAKLEEF":  "सांस तकलीफ",
    "SEENE-DARD":    "सीने में दर्द",
    "CHAKKAR":       "चक्कर",
    "KAMZORI":       "कमज़ोरी",
}

ICD10: dict[str, str] = {
    "DARD":          "R52",
    "BUKHAR":        "R50.9",
    "SAR-DARD":      "R51",
    "PET-DARD":      "R10.9",
    "ULTI":          "R11.2",
    "SANS-TAKLEEF":  "R06.00",
    "SEENE-DARD":    "R07.9",
    "CHAKKAR":       "R42",
    "KAMZORI":       "R53.83",
}

# ── Base confidence thresholds ────────────────────────────────────────────────
_BASE_THRESHOLDS: dict[str, float] = {
    "DARD":          0.78,
    "BUKHAR":        0.82,
    "SAR-DARD":      0.80,
    "PET-DARD":      0.76,
    "ULTI":          0.84,
    "SANS-TAKLEEF":  0.85,
    "SEENE-DARD":    0.86,
    "CHAKKAR":       0.79,
    "KAMZORI":       0.75,
}

# ── Demographic threshold adjustments (§3A–D) ─────────────────────────────────
# Negative delta = lower threshold (easier to fire)
_DEMO_DELTA: dict[str, dict[str, float]] = {
    # Women: atypical MI presentation → lower SEENE-DARD threshold
    "women":   {"SEENE-DARD": -0.05},
    # Men: no adjustments
    "men":     {},
    # Children: partial signs accepted → lower across the board
    "child":   {"_default": -0.15},
    # Elderly: SEENE-DARD at ≥0.55 (§3D "HIGHEST PRIORITY"), SANS-TAKLEEF lower too
    "elderly": {"SEENE-DARD": -0.31, "SANS-TAKLEEF": -0.25, "KAMZORI": -0.05},
}

def _get_threshold(sign: str, demographic: str = "men") -> float:
    base  = _BASE_THRESHOLDS.get(sign, 0.80)
    adj   = _DEMO_DELTA.get(demographic, {})
    delta = adj.get(sign, adj.get("_default", 0.0))
    return max(0.50, base + delta)


# ── Runtime constants ─────────────────────────────────────────────────────────
VOTE_FRAMES            = 5      # consecutive frames for non-critical confirmation
WINDOW_SIZE            = 60     # rolling history (6s at 10fps)
CARDIAC_COMBO_WINDOW_S = 10.0   # seconds for CARDIAC_EMERGENCY combo
EMA_ALPHA              = 0.35   # tremor filter smoothing factor (elderly)


# ── Normalisation ─────────────────────────────────────────────────────────────
def _normalize(landmarks) -> np.ndarray:
    """
    Wrist-centred, palm-width normalised — matches frontend islNormalize.js exactly.
    landmarks: list of 21 objects with .x .y .z attributes (MediaPipe format).
    Returns float32 (63,).
    """
    pts   = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    wrist = pts[0]
    mcp   = pts[9]   # middle-finger MCP
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    return ((pts - wrist) / scale).flatten()


# ── ISLDetector ───────────────────────────────────────────────────────────────
class ISLDetector:
    """
    Stateful, frame-by-frame ISL symptom detector.

    Usage:
        detector = ISLDetector()
        detector.set_demographic("elderly")   # optional — adjusts thresholds
        result   = detector.process_frame(cv2_bgr_frame)
        detector.reset()   # between patients
        detector.close()   # on session end
    """

    def __init__(self, model_path: Optional[str] = None, demographic: str = "men"):
        # ── MediaPipe Hands ───────────────────────────────────────────────────
        self._mp_hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
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
                self._model.predict(np.zeros((1, 126), dtype=np.float32), verbose=0)
                logger.info(f"[ISLDetector] model loaded from {model_path}")
            except Exception as exc:
                logger.error(f"[ISLDetector] model load failed: {exc}")
        else:
            logger.warning(f"[ISLDetector] model not found at {model_path} — landmark-only mode")

        # ── Demographic profile ───────────────────────────────────────────────
        self._demographic: str = demographic

        # ── State ─────────────────────────────────────────────────────────────
        self._vote_buffer: deque[str]  = deque(maxlen=VOTE_FRAMES)
        self._history: deque[str]      = deque(maxlen=WINDOW_SIZE)
        self._fill: float              = 0.0
        self._last_confirmed: Optional[str] = None
        self._critical_timestamps: dict[str, float] = {}

        # Tremor EMA state (elderly)
        self._ema: Optional[np.ndarray] = None

    # ── Public API ────────────────────────────────────────────────────────────

    def set_demographic(self, demographic: str) -> None:
        """Update the demographic profile; resets EMA filter."""
        valid = {"women", "men", "child", "elderly"}
        if demographic not in valid:
            logger.warning(f"[ISLDetector] unknown demographic '{demographic}', keeping '{self._demographic}'")
            return
        self._demographic = demographic
        self._ema = None
        logger.info(f"[ISLDetector] demographic set to '{demographic}'")

    def process_frame(self, bgr_frame: np.ndarray) -> dict:
        """
        Process one BGR video frame.

        Returns dict with keys:
            sign, english, hindi, icd10, urgency,
            confidence, confirmed, escalate, fill,
            has_hand, cardiac_emergency, all_confidences,
            demographic, model_notes
        """
        now = time.time()

        # ── Run MediaPipe ─────────────────────────────────────────────────────
        rgb     = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        results = self._mp_hands.process(rgb)

        if not results.multi_hand_landmarks:
            self._vote_buffer.clear()
            self._fill  = max(0.0, self._fill - 0.15)
            self._ema   = None
            return self._no_hand_result()

        # ── Build 126-float feature vector (right[63] + left[63]) ────────────
        right = np.zeros(63, dtype=np.float32)
        left  = np.zeros(63, dtype=np.float32)
        for i, lm_group in enumerate(results.multi_hand_landmarks):
            label  = results.multi_handedness[i].classification[0].label
            normed = _normalize(lm_group.landmark)
            if label == "Right":
                right = normed
            else:
                left = normed
        features = np.concatenate([right, left])

        # ── Elderly tremor filter (EMA) ───────────────────────────────────────
        if self._demographic == "elderly":
            if self._ema is None:
                self._ema = features.copy()
            else:
                self._ema  = EMA_ALPHA * features + (1 - EMA_ALPHA) * self._ema
            features = self._ema

        # ── Model inference ───────────────────────────────────────────────────
        if self._model is None:
            return {**self._base_result(), "has_hand": True,
                    "model_notes": "Model not loaded — landmark-only mode"}

        raw_scores = self._model.predict(
            features.reshape(1, 126), verbose=0
        )[0].tolist()

        all_confidences = {
            LABELS[i]: round(raw_scores[i], 4)
            for i in range(min(len(LABELS), len(raw_scores)))
        }

        best_idx  = int(np.argmax(raw_scores))
        best_conf = float(raw_scores[best_idx])
        best_lbl  = LABELS[best_idx] if best_idx < len(LABELS) else "UNCERTAIN"

        # Anti-hallucination: cap suspiciously high confidence
        notes = ""
        if best_conf > 0.95:
            notes     = "High confidence flagged — verify model calibration"
            best_conf = 0.95

        # Skip reserved output classes from voting
        if best_lbl in ("UNCERTAIN", "NO_SIGN"):
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": "Reserved class output"}

        # ── Demographic-adjusted threshold ────────────────────────────────────
        threshold = _get_threshold(best_lbl, self._demographic)
        if best_conf < threshold:
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": notes or "Below confidence threshold"}

        # ── CRITICAL signs: fire immediately (§8) ────────────────────────────
        if best_lbl in CRITICAL_SIGNS:
            self._critical_timestamps[best_lbl] = now
            cardiac_emergency = self._check_cardiac_emergency()
            self._history.append(best_lbl)
            self._fill            = 1.0
            self._last_confirmed  = best_lbl

            return {
                "sign":              best_lbl,
                "english":           best_lbl.replace("-", " ").title(),
                "hindi":             HINDI_LABELS.get(best_lbl),
                "icd10":             ICD10.get(best_lbl),
                "urgency":           URGENCY.get(best_lbl, "unknown"),
                "confidence":        round(best_conf, 4),
                "confirmed":         True,
                "escalate":          True,
                "fill":              1.0,
                "has_hand":          True,
                "cardiac_emergency": cardiac_emergency,
                "all_confidences":   all_confidences,
                "demographic":       self._demographic,
                "model_notes":       notes,
            }

        # ── Non-critical: VOTE_FRAMES consecutive agreement ───────────────────
        self._vote_buffer.append(best_lbl)
        vote_count = sum(1 for v in self._vote_buffer if v == best_lbl)
        self._fill = vote_count / VOTE_FRAMES

        confirmed = vote_count >= VOTE_FRAMES
        if confirmed:
            self._last_confirmed = best_lbl
            self._history.append(best_lbl)

        return {
            "sign":              best_lbl if confirmed else None,
            "english":           best_lbl.replace("-", " ").title() if confirmed else None,
            "hindi":             HINDI_LABELS.get(best_lbl) if confirmed else None,
            "icd10":             ICD10.get(best_lbl) if confirmed else None,
            "urgency":           URGENCY.get(best_lbl, "unknown"),
            "confidence":        round(best_conf, 4),
            "confirmed":         confirmed,
            "escalate":          confirmed and URGENCY.get(best_lbl) in ("high", "critical"),
            "fill":              round(self._fill, 3),
            "has_hand":          True,
            "cardiac_emergency": False,
            "all_confidences":   all_confidences,
            "demographic":       self._demographic,
            "model_notes":       notes,
        }

    def reset(self) -> None:
        """Reset voting state between patients."""
        self._vote_buffer.clear()
        self._fill           = 0.0
        self._last_confirmed = None
        self._critical_timestamps.clear()
        self._ema            = None
        logger.info("[ISLDetector] state reset")

    def close(self) -> None:
        self._mp_hands.close()
        logger.info("[ISLDetector] closed")

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _check_cardiac_emergency(self) -> bool:
        """CARDIAC_EMERGENCY = SEENE-DARD + SANS-TAKLEEF within CARDIAC_COMBO_WINDOW_S."""
        ts1 = self._critical_timestamps.get("SEENE-DARD", 0.0)
        ts2 = self._critical_timestamps.get("SANS-TAKLEEF", 0.0)
        return ts1 > 0 and ts2 > 0 and abs(ts1 - ts2) <= CARDIAC_COMBO_WINDOW_S

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
            "demographic":       "men",
            "model_notes":       "",
        }

    @staticmethod
    def _no_hand_result() -> dict:
        return {**ISLDetector._base_result(), "model_notes": "NO_HAND_DETECTED"}
