"""
collect_dynamic.py
==================
Collects 30 sequences × 30 frames per dynamic ISL sign for LSTM training.
Uses MediaPipe Tasks API (mediapipe >= 0.10) — NOT the old mp.solutions API.

Dynamic signs (Model 2 - LSTM):
  8. headache     - palm rubbing forehead side to side
  9. stomachache  - palm doing circular motion on stomach
  10. joint_pain  - hands squeezing and releasing on knee area

Output: data_collection/data/dynamic_sequences/{sign_name}/{seq_number}.npy
  Each .npy = array of shape (30, 258)

Keypoints per frame (258 total):
  Left hand:  21 landmarks × 3 (x,y,z) = 63
  Right hand: 21 landmarks × 3 (x,y,z) = 63
  Pose:       33 landmarks × 4 (x,y,z,visibility) = 132

Controls:
  [8]     - select headache
  [9]     - select stomachache
  [0]     - select joint_pain
  [SPACE] - start recording one 30-frame sequence
  [q]     - quit
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import numpy as np
import os
import time
import urllib.request

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
DATA_DIR       = os.path.join(BASE_DIR, "data", "dynamic_sequences")
HAND_MODEL     = os.path.join(BASE_DIR, "hand_landmarker.task")
POSE_MODEL     = os.path.join(BASE_DIR, "pose_landmarker.task")
SEQUENCES_GOAL = 30
FRAMES_PER_SEQ = 30
COUNTDOWN_SEC  = 3

DYNAMIC_SIGNS = ["headache", "stomachache", "joint_pain"]

INSTRUCTIONS = {
    "headache":    "Rub palm on forehead side to side (full sweep)",
    "stomachache": "Palm flat on stomach, slow circular motion",
    "joint_pain":  "Both hands on knees — squeeze and release twice",
}

KEY_MAP = {
    ord('8'): "headache",
    ord('9'): "stomachache",
    ord('0'): "joint_pain",
}

# ── Download models if missing ────────────────────────────────────────────────
def ensure_models():
    if not os.path.exists(HAND_MODEL):
        print("  Downloading hand_landmarker.task (~8MB)...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/"
            "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            HAND_MODEL)
        print("  Hand model downloaded.")
    if not os.path.exists(POSE_MODEL):
        print("  Downloading pose_landmarker.task (~6MB)...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/"
            "pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            POSE_MODEL)
        print("  Pose model downloaded.")

# ── Keypoint extraction ───────────────────────────────────────────────────────
def extract_keypoints(hand_result, pose_result):
    """
    Returns np.array of shape (258,):
      [0:63]    left hand  (21 * xyz)
      [63:126]  right hand (21 * xyz)
      [126:258] pose       (33 * xyzv)
    """
    # Determine left/right from handedness
    lh = np.zeros(63)
    rh = np.zeros(63)

    if hand_result and hand_result.hand_landmarks:
        for i, hand_lm in enumerate(hand_result.hand_landmarks):
            handedness = hand_result.handedness[i][0].category_name  # "Left" or "Right"
            arr = np.array([[lm.x, lm.y, lm.z] for lm in hand_lm]).flatten()
            if handedness == "Left":
                lh = arr
            else:
                rh = arr

    pose = np.zeros(132)
    if pose_result and pose_result.pose_landmarks:
        pose = np.array([[lm.x, lm.y, lm.z, lm.visibility]
                         for lm in pose_result.pose_landmarks[0]]).flatten()

    return np.concatenate([lh, rh, pose])

# ── Skeleton drawing ──────────────────────────────────────────────────────────
HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),
    (5,9),(9,10),(10,11),(11,12),(9,13),(13,14),(14,15),(15,16),
    (13,17),(17,18),(18,19),(19,20),(0,17),
]

def draw_hand(frame, landmarks, h, w, color=(86, 180, 86)):
    pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for a, b in HAND_CONNECTIONS:
        cv2.line(frame, pts[a], pts[b], color, 2)
    for pt in pts:
        cv2.circle(frame, pt, 3, (200, 220, 255), -1)

# ── Sequence helpers ──────────────────────────────────────────────────────────
def count_sequences(sign):
    sign_dir = os.path.join(DATA_DIR, sign)
    if not os.path.exists(sign_dir):
        return 0
    return len([f for f in os.listdir(sign_dir) if f.endswith(".npy")])

def save_sequence(sign, buf):
    sign_dir = os.path.join(DATA_DIR, sign)
    os.makedirs(sign_dir, exist_ok=True)
    seq_num  = count_sequences(sign)
    path     = os.path.join(sign_dir, f"{seq_num:04d}.npy")
    np.save(path, np.array(buf))
    return path

# ── UI ────────────────────────────────────────────────────────────────────────
def draw_ui(frame, sign, seq_count, state, frame_in_seq, countdown_left):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 170), (15, 15, 15), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    cv2.putText(frame, f"SIGN: {sign.upper()}", (15, 38),
                cv2.FONT_HERSHEY_DUPLEX, 1.0, (100, 220, 100), 2)
    cv2.putText(frame, f"Sequences: {seq_count}/{SEQUENCES_GOAL}", (15, 72),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
    cv2.putText(frame, INSTRUCTIONS.get(sign, ""), (15, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 230, 255), 1)

    bx, by, bw, bh = 15, 112, w - 30, 12
    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (60, 60, 60), -1)
    filled = int(bw * min(seq_count / SEQUENCES_GOAL, 1.0))
    cv2.rectangle(frame, (bx, by), (bx + filled, by + bh), (86, 180, 86), -1)

    if state == "idle":
        cv2.putText(frame, "Press SPACE to record a sequence", (15, 148),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (180, 180, 180), 1)
    elif state == "countdown":
        cv2.putText(frame, f"GET READY... {int(np.ceil(countdown_left))}", (15, 148),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)
    elif state == "recording":
        cv2.rectangle(frame, (0, 0), (w, h), (0, 0, 220), 6)
        fp_x, fp_y, fp_w, fp_h = 15, h - 30, w - 30, 18
        cv2.rectangle(frame, (fp_x, fp_y), (fp_x + fp_w, fp_y + fp_h), (60, 60, 60), -1)
        fp_f = int(fp_w * frame_in_seq / FRAMES_PER_SEQ)
        cv2.rectangle(frame, (fp_x, fp_y), (fp_x + fp_f, fp_y + fp_h), (0, 0, 220), -1)
        cv2.putText(frame, f"REC: {frame_in_seq}/{FRAMES_PER_SEQ} frames",
                    (15, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 100, 255), 1)
    elif state == "saved":
        cv2.rectangle(frame, (0, 0), (w, h), (0, 200, 80), 6)
        cv2.putText(frame, f"Saved! ({seq_count}/{SEQUENCES_GOAL})", (15, 148),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 220, 100), 2)

    if state != "recording":
        cv2.putText(frame, "[8]headache [9]stomach [0]joint [SPACE]record [q]quit",
                    (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (140, 140, 140), 1)
    return frame

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ensure_models()

    print("\n=== Swasthya Setu – Dynamic Sign Data Collector ===")
    for s in DYNAMIC_SIGNS:
        print(f"  {s:12s}: {count_sequences(s)}/{SEQUENCES_GOAL} sequences")
    print("\n  [8] headache | [9] stomachache | [0] joint_pain | [SPACE] record | [q] quit\n")

    # Build hand landmarker (VIDEO mode)
    hand_options = mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    hand_lm = mp_vision.HandLandmarker.create_from_options(hand_options)

    # Build pose landmarker (VIDEO mode)
    pose_options = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=mp_vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    pose_lm = mp_vision.PoseLandmarker.create_from_options(pose_options)

    current_sign  = DYNAMIC_SIGNS[0]
    state         = "idle"
    countdown_end = 0.0
    sequence_buf  = []
    frame_in_seq  = 0
    saved_flash_t = 0.0
    frame_ts_ms   = 0

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame      = cv2.flip(frame, 1)
        h, w       = frame.shape[:2]
        frame_ts_ms += 33

        rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img    = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        h_result  = hand_lm.detect_for_video(mp_img, frame_ts_ms)
        p_result  = pose_lm.detect_for_video(mp_img, frame_ts_ms)

        # Draw skeletons
        if h_result.hand_landmarks:
            for hand_lms in h_result.hand_landmarks:
                draw_hand(frame, hand_lms, h, w)

        now = time.time()
        seq_count = count_sequences(current_sign)

        if state == "countdown":
            remaining = countdown_end - now
            if remaining <= 0:
                state        = "recording"
                sequence_buf = []
                frame_in_seq = 0
                print(f"  Recording seq {seq_count + 1}/{SEQUENCES_GOAL} for '{current_sign}'...")

        elif state == "recording":
            kp = extract_keypoints(h_result, p_result)
            sequence_buf.append(kp)
            frame_in_seq += 1
            if frame_in_seq >= FRAMES_PER_SEQ:
                path = save_sequence(current_sign, sequence_buf)
                print(f"  Saved: {path}  shape={np.array(sequence_buf).shape}")
                state         = "saved"
                saved_flash_t = now

        elif state == "saved":
            if now - saved_flash_t > 1.0:
                state = "idle"

        countdown_left = max(0, countdown_end - now) if state == "countdown" else 0
        frame = draw_ui(frame, current_sign, seq_count, state, frame_in_seq, countdown_left)
        cv2.imshow("ISL Dynamic Collector", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord(' '):
            if state == "idle":
                if count_sequences(current_sign) >= SEQUENCES_GOAL:
                    print(f"  '{current_sign}' already complete!")
                else:
                    state         = "countdown"
                    countdown_end = now + COUNTDOWN_SEC
                    print(f"  Starting in {COUNTDOWN_SEC}s — do: {INSTRUCTIONS[current_sign]}")
        elif key in KEY_MAP:
            if state == "idle":
                current_sign = KEY_MAP[key]
                print(f"  Selected: {current_sign} [{count_sequences(current_sign)}/{SEQUENCES_GOAL}]")

    cap.release()
    cv2.destroyAllWindows()
    hand_lm.close()
    pose_lm.close()

    print("\n=== Final Summary ===")
    all_done = True
    for s in DYNAMIC_SIGNS:
        n    = count_sequences(s)
        done = n >= SEQUENCES_GOAL
        if not done:
            all_done = False
        print(f"  {s:12s}: {n}/{SEQUENCES_GOAL}  {'DONE' if done else f'NEED {SEQUENCES_GOAL-n} more'}")
    if all_done:
        print("\n  All dynamic signs complete! Ready for Phase 2 training.")


if __name__ == "__main__":
    main()
