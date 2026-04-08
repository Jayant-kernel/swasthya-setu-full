"""
collect_static.py
=================
Collects 200 landmark samples per static ISL sign and saves to CSV.
Uses MediaPipe Tasks API (mediapipe >= 0.10) — NOT the old mp.solutions API.

Static signs (Model 1 - Random Forest):
  1. fever       - open palm facing outward, fingers spread wide
  2. pain        - fist pressed forward toward camera
  3. vomit       - fingers pointing outward from mouth area
  4. cough       - fist on chest, thumb pointing up
  5. weakness    - wrist bent down, fingers hanging loosely
  6. dizziness   - single index finger pointing to forehead
  7. breathless  - both open palms pushed outward from chest
  8. no_sign     - neutral resting hand (rejection class)

Output: data_collection/data/static_keypoints.csv
Format: sign_label, x0, y0, x1, y1, ... x20, y20  (43 columns)

Controls:
  [1-8]   - select sign to record
  [SPACE] - capture one sample manually
  [a]     - toggle auto-capture (10fps, hold sign steady)
  [q]     - quit
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import csv
import os
import time
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "data")
CSV_PATH  = os.path.join(DATA_DIR, "static_keypoints.csv")
MODEL_PATH = os.path.join(BASE_DIR, "hand_landmarker.task")
GOAL      = 200
AUTO_FPS  = 10

STATIC_SIGNS = [
    "fever", "pain", "vomit", "cough",
    "weakness", "dizziness", "breathless",
    "headache", "stomachache", "joint_pain",
]

# Keys: 1-9 for first 9 signs, 0 for 10th (joint_pain)
INSTRUCTIONS = {
    "fever":       "Open palm, fingers spread wide, face palm outward",
    "pain":        "Closed fist pushed forward toward camera",
    "vomit":       "Fingers together pointing outward from near mouth",
    "cough":       "Closed fist on chest, thumb pointing up",
    "weakness":    "Wrist bent down, fingers hanging loosely downward",
    "dizziness":   "Only index finger up, pointing toward forehead",
    "breathless":  "ONE open palm on chest, fingers spread, push outward toward camera",
    "headache":    "Palm flat PRESSED on forehead, fingers spread wide",
    "stomachache": "Palm flat PRESSED on stomach, fingers pointing downward",
    "joint_pain":  "Closed fist PRESSED on knee, thumb tucked to side",
}

# ── Download model if missing ─────────────────────────────────────────────────
def ensure_model():
    if not os.path.exists(MODEL_PATH):
        print("  Downloading hand_landmarker.task (~8MB)...")
        url = ("https://storage.googleapis.com/mediapipe-models/"
               "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")
        urllib.request.urlretrieve(url, MODEL_PATH)
        print("  Model downloaded.")

# ── Normalization ─────────────────────────────────────────────────────────────
def normalize_landmarks(landmarks):
    """
    landmarks: list of 21 NormalizedLandmark objects (each has .x .y .z)
    Returns flat np.array (42,) — x,y only, wrist-origin, scale-invariant.
    """
    coords = np.array([[lm.x, lm.y] for lm in landmarks])  # (21, 2)
    coords -= coords[0]                                      # wrist → origin
    scale = np.linalg.norm(coords[12])
    if scale < 1e-6:
        scale = 1.0
    coords /= scale
    return coords.flatten()  # (42,)

# ── Draw skeleton manually (Tasks API has no drawing_utils) ───────────────────
HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),
    (0,5),(5,6),(6,7),(7,8),
    (5,9),(9,10),(10,11),(11,12),
    (9,13),(13,14),(14,15),(15,16),
    (13,17),(17,18),(18,19),(19,20),
    (0,17),
]

def draw_landmarks_manual(frame, landmarks, h, w):
    pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for a, b in HAND_CONNECTIONS:
        cv2.line(frame, pts[a], pts[b], (86, 180, 86), 2)
    for pt in pts:
        cv2.circle(frame, pt, 4, (200, 220, 255), -1)

# ── CSV helpers ───────────────────────────────────────────────────────────────
def ensure_csv():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            cols = ["label"] + [f"{c}{i}" for i in range(21) for c in ("x", "y")]
            writer.writerow(cols)

def count_samples():
    counts = {s: 0 for s in STATIC_SIGNS}
    if not os.path.exists(CSV_PATH):
        return counts
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label = row.get("label", "")
            if label in counts:
                counts[label] += 1
    return counts

def save_sample(label, vec):
    with open(CSV_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([label] + vec.tolist())

# ── UI drawing ────────────────────────────────────────────────────────────────
def draw_ui(frame, sign, counts, auto_mode, hand_found, last_flash):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 160), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

    cnt = counts[sign]
    col = (0, 220, 100) if cnt >= GOAL else (100, 200, 255)
    cv2.putText(frame, f"SIGN: {sign.upper()}", (15, 38),
                cv2.FONT_HERSHEY_DUPLEX, 1.0, col, 2)
    cv2.putText(frame, f"{cnt}/{GOAL} samples", (15, 72),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
    cv2.putText(frame, INSTRUCTIONS.get(sign, ""), (15, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 230, 255), 1)

    # Progress bar
    bx, by, bw, bh = 15, 115, w - 30, 14
    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (60, 60, 60), -1)
    filled = int(bw * min(cnt / GOAL, 1.0))
    cv2.rectangle(frame, (bx, by), (bx + filled, by + bh),
                  (0, 200, 80) if cnt >= GOAL else (86, 110, 15), -1)
    for mark in [50, 100, 150]:
        mx = bx + int(bw * mark / GOAL)
        cv2.line(frame, (mx, by - 3), (mx, by + bh + 3), (255, 200, 0), 1)

    mode_text = "[A] AUTO ON" if auto_mode else "[A] AUTO OFF"
    mode_col  = (0, 180, 255) if auto_mode else (180, 180, 180)
    cv2.putText(frame, mode_text, (15, 148),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, mode_col, 1)

    # Hand indicator
    dot_col = (0, 255, 80) if hand_found else (0, 0, 220)
    cv2.circle(frame, (w - 25, 25), 12, dot_col, -1)

    # Flash border on capture
    if time.time() - last_flash < 0.08:
        cv2.rectangle(frame, (0, 0), (w, h), (0, 255, 100), 6)

    # Sign selector strip at bottom
    panel_y = h - 30
    cv2.rectangle(frame, (0, panel_y - 10), (w, h), (20, 20, 20), -1)
    for i, s in enumerate(STATIC_SIGNS):
        x = 10 + i * (w // len(STATIC_SIGNS))
        c = (0, 220, 100) if s == sign else (140, 140, 140)
        cv2.putText(frame, f"[{i+1}]{s[:4]}", (x, panel_y + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.32, c, 1)

    cv2.putText(frame, "[1-9,0]=sign  [SPACE]=capture  [a]=auto  [q]=quit",
                (15, h - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (120, 120, 120), 1)
    return frame

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ensure_model()
    ensure_csv()
    counts = count_samples()

    print("\n=== Swasthya Setu – Static Sign Data Collector ===")
    print(f"  CSV: {CSV_PATH}")
    print(f"  Goal: {GOAL} samples per sign\n")
    for s in STATIC_SIGNS:
        bar = "█" * (counts[s] * 20 // GOAL)
        print(f"  {s:12s}: {counts[s]:3d}/{GOAL}  {bar}")
    print("\n  Keys: [1-9] signs 1-9 | [0] joint_pain | [SPACE] capture | [a] auto | [q] quit\n")

    # ── Build Tasks-API hand landmarker (VIDEO mode = stateful tracking) ──────
    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = mp_vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    landmarker = mp_vision.HandLandmarker.create_from_options(options)

    current_sign = STATIC_SIGNS[0]
    auto_mode    = False
    last_flash   = 0.0
    last_auto    = 0.0

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    frame_ts_ms = 0  # monotonic timestamp for VIDEO mode

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w  = frame.shape[:2]
        frame_ts_ms += 33  # ~30fps

        # Run detection
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image  = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result    = landmarker.detect_for_video(mp_image, frame_ts_ms)

        hand_found = bool(result.hand_landmarks)
        vec = None

        if hand_found:
            lm_list = result.hand_landmarks[0]  # first hand
            vec = normalize_landmarks(lm_list)
            draw_landmarks_manual(frame, lm_list, h, w)

        # Auto-capture
        now = time.time()
        if auto_mode and hand_found and vec is not None:
            if (now - last_auto) >= (1.0 / AUTO_FPS):
                if counts[current_sign] < GOAL:
                    save_sample(current_sign, vec)
                    counts[current_sign] += 1
                    last_flash = now
                last_auto = now

        frame = draw_ui(frame, current_sign, counts, auto_mode, hand_found, last_flash)
        cv2.imshow("ISL Static Collector", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord(' '):
            if hand_found and vec is not None and counts[current_sign] < GOAL:
                save_sample(current_sign, vec)
                counts[current_sign] += 1
                last_flash = time.time()
                print(f"  Captured: {current_sign} [{counts[current_sign]}/{GOAL}]")
        elif key == ord('a'):
            auto_mode = not auto_mode
            print(f"  Auto-mode: {'ON' if auto_mode else 'OFF'}")
        elif ord('1') <= key <= ord('9'):
            idx = key - ord('1')
            if idx < len(STATIC_SIGNS):
                current_sign = STATIC_SIGNS[idx]
                auto_mode = False
                print(f"  Selected: {current_sign} [{counts[current_sign]}/{GOAL}]")
        elif key == ord('0'):
            # Key 0 = 10th sign (joint_pain)
            current_sign = STATIC_SIGNS[9]
            auto_mode = False
            print(f"  Selected: {current_sign} [{counts[current_sign]}/{GOAL}]")

    cap.release()
    cv2.destroyAllWindows()
    landmarker.close()

    counts = count_samples()
    print("\n=== Final Summary ===")
    all_done = True
    for s in STATIC_SIGNS:
        done = counts[s] >= GOAL
        if not done:
            all_done = False
        status = "DONE" if done else f"NEED {GOAL - counts[s]} more"
        print(f"  {s:12s}: {counts[s]:3d}/{GOAL}  {status}")
    if all_done:
        print("\n  All signs complete! Ready for Phase 2 training.")
    else:
        print("\n  Run again to collect remaining samples.")


if __name__ == "__main__":
    main()
