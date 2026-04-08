"""
isl_detector.py
===============
Main real-time ISL detection class.
Loads the trained Random Forest model and runs inference on each frame.

Usage:
    detector = ISLDetector()
    result   = detector.process_frame(frame_bgr)
    # result = {
    #   "sign":      "fever" | None,
    #   "confidence": 0.0-1.0,
    #   "confirmed":  True/False,
    #   "fill":       0.0-1.0,   ← for confidence bar
    #   "odia":       "ଜ୍ୱର" | None,
    #   "english":    "Fever" | None,
    #   "has_hand":   True/False
    # }
"""

import os
import sys
import json
import numpy as np
import joblib
import urllib.request
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# Allow importing smoother from same package or direct run
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from smoother import TemporalSmoother

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR  = os.path.join(BASE_DIR, "models")
MODEL_PATH  = os.path.join(MODELS_DIR, "static_rf_model.pkl")
ENCODER_PATH= os.path.join(MODELS_DIR, "static_label_encoder.pkl")
LABELS_PATH = os.path.join(MODELS_DIR, "isl_labels.json")
CLASSES_PATH= os.path.join(MODELS_DIR, "static_classes.json")
HAND_MODEL  = os.path.join(BASE_DIR, "data_collection", "hand_landmarker.task")

CONFIDENCE_THRESHOLD = 0.75


# ── Geometric helpers ─────────────────────────────────────────────────────────
def _fingers_extended(landmarks) -> list[bool]:
    """
    Returns [thumb, index, middle, ring, pinky] — True if finger is extended.
    Uses tip-vs-pip y comparison (lower y = higher on screen).
    """
    # Landmark indices: tips = 4,8,12,16,20 ; pips = 3,6,10,14,18
    tips = [4, 8, 12, 16, 20]
    pips = [3, 6, 10, 14, 18]
    extended = []
    for tip, pip in zip(tips, pips):
        extended.append(landmarks[tip].y < landmarks[pip].y)
    return extended


def _geometric_validate(sign: str, landmarks) -> bool:
    """
    Returns True if the hand geometry is consistent with the predicted sign.
    Used to prevent confusion between visually similar signs.
    """
    if sign not in ("fever", "breathless", "dizziness", "cough"):
        return True  # only validate the commonly confused signs

    ext = _fingers_extended(landmarks)
    # thumb=ext[0], index=ext[1], middle=ext[2], ring=ext[3], pinky=ext[4]
    n_extended = sum(ext)

    if sign == "fever":
        # Fever: open palm — all 4 fingers extended, wrist held upright
        fingers_open = ext[1] and ext[2] and ext[3] and ext[4]
        wrist_below_mcp = landmarks[0].y > landmarks[9].y
        return fingers_open and wrist_below_mcp

    if sign == "breathless":
        # Breathless: open palm pushed outward — ≥4 fingers extended
        return n_extended >= 4

    if sign == "dizziness":
        # Dizziness: only index finger up, others curled
        index_up = ext[1]
        others_curled = not ext[2] and not ext[3] and not ext[4]
        return index_up and others_curled

    if sign == "cough":
        # Cough: closed fist — at most 1 finger extended (thumb may stick out)
        return n_extended <= 1

    return True


def _download_hand_model():
    if not os.path.exists(HAND_MODEL):
        print("[ISLDetector] Downloading hand_landmarker.task...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/"
            "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            HAND_MODEL
        )
        print("[ISLDetector] Model downloaded.")


def _normalize_landmarks(landmarks) -> np.ndarray:
    """
    Normalize 21 landmarks → flat array (42,)
    Same formula used during data collection.
    """
    coords = np.array([[lm.x, lm.y] for lm in landmarks])  # (21, 2)
    coords -= coords[0]                                      # wrist origin
    scale   = np.linalg.norm(coords[12])
    if scale < 1e-6:
        scale = 1.0
    coords /= scale
    return coords.flatten()


class ISLDetector:
    def __init__(self):
        _download_hand_model()

        # Load RF model + label encoder
        self.rf      = joblib.load(MODEL_PATH)
        self.encoder = joblib.load(ENCODER_PATH)

        # Load Odia/English label map
        with open(LABELS_PATH, encoding='utf-8') as f:
            self.labels = json.load(f)

        # Load class list
        with open(CLASSES_PATH, encoding='utf-8') as f:
            self.classes = json.load(f)

        # Temporal smoother
        self.smoother = TemporalSmoother(window=8, threshold=5)

        # Cough motion tracker — stores recent wrist Y positions
        self._wrist_y_history = []
        self._COUGH_MOTION_WINDOW = 8   # frames to look back
        self._COUGH_MOTION_THRESH = 0.04  # min wrist Y range to count as motion

        # MediaPipe hand landmarker (VIDEO mode)
        options = mp_vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
            running_mode=mp_vision.RunningMode.VIDEO,
            num_hands=1,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = mp_vision.HandLandmarker.create_from_options(options)
        self._frame_ts  = 0  # monotonic timestamp for VIDEO mode

        print("[ISLDetector] Ready.")

    def process_frame(self, frame_bgr: np.ndarray) -> dict:
        """
        Run detection on one BGR frame (from OpenCV or decoded JPEG).
        Returns a result dict.
        """
        self._frame_ts += 33  # ~30fps

        # Run MediaPipe
        rgb    = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect_for_video(mp_img, self._frame_ts)

        # No hand → reset smoother and motion history, return empty
        if not result.hand_landmarks:
            self.smoother.reset()
            self._wrist_y_history.clear()
            return {
                "sign":       None,
                "confidence": 0.0,
                "confirmed":  False,
                "fill":       0.0,
                "odia":       None,
                "english":    None,
                "has_hand":   False,
            }

        # Normalize landmarks
        lm_list = result.hand_landmarks[0]
        vec     = _normalize_landmarks(lm_list).reshape(1, -1)

        # Track wrist Y for cough motion detection
        wrist_y = lm_list[0].y
        self._wrist_y_history.append(wrist_y)
        if len(self._wrist_y_history) > self._COUGH_MOTION_WINDOW:
            self._wrist_y_history.pop(0)

        # Predict
        proba      = self.rf.predict_proba(vec)[0]
        best_idx   = int(np.argmax(proba))
        best_conf  = float(proba[best_idx])
        best_sign  = self.encoder.inverse_transform([best_idx])[0]

        # Build per-class confidence map (for UI preview bars)
        all_confidences = {
            self.encoder.inverse_transform([i])[0]: float(p)
            for i, p in enumerate(proba)
        }

        # Geometric validation for confusion-prone signs
        geo_ok = _geometric_validate(best_sign, lm_list)

        # For cough: also require up/down wrist motion
        if best_sign == "cough" and geo_ok:
            if len(self._wrist_y_history) >= 4:
                y_range = max(self._wrist_y_history) - min(self._wrist_y_history)
                geo_ok = y_range >= self._COUGH_MOTION_THRESH

        # Below threshold OR failed geometric check → show preview only
        if best_conf < CONFIDENCE_THRESHOLD or not geo_ok:
            self.smoother.reset()
            return {
                "sign":            best_sign,
                "confidence":      best_conf if geo_ok else best_conf * 0.5,
                "confirmed":       False,
                "fill":            (best_conf / CONFIDENCE_THRESHOLD) if geo_ok else 0.0,
                "odia":            None,
                "english":         None,
                "has_hand":        True,
                "all_confidences": all_confidences,
            }

        # Above threshold + geometry ok → feed smoother
        stable_sign, is_confirmed = self.smoother.update(best_sign)
        fill = self.smoother.fill

        odia    = self.labels.get(stable_sign, {}).get("odia")    if is_confirmed else None
        english = self.labels.get(stable_sign, {}).get("english") if is_confirmed else None

        return {
            "sign":            stable_sign,
            "confidence":      best_conf,
            "confirmed":       is_confirmed,
            "fill":            fill,
            "odia":            odia,
            "english":         english,
            "has_hand":        True,
            "all_confidences": all_confidences,
        }

    def reset(self):
        self.smoother.reset()

    def close(self):
        self.landmarker.close()
