# -*- coding: utf-8 -*-
"""
extract_landmarks.py
Extract MediaPipe hand landmarks from training videos -> training_data.json

Usage:
    python extract_landmarks.py --videos C:/Users/jayan/Desktop/vedios --label ULTI
    python extract_landmarks.py --videos C:/Users/jayan/Desktop/vedios
"""

import argparse
import json
import os
import sys
import urllib.request

import cv2
import mediapipe as mp
import numpy as np

from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions, HandLandmarker
from mediapipe.tasks.python.core.base_options import BaseOptions

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--videos", required=True)
parser.add_argument("--label",  default=None)
parser.add_argument("--skip",   default=2, type=int)
args = parser.parse_args()

HERE      = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "frontend", "training_data.json")

VALID_LABELS = [
    "DARD", "BUKHAR", "SAR-DARD", "PET-DARD", "ULTI",
    "KHANSI", "SANS-TAKLEEF", "SEENE-DARD", "CHAKKAR", "KAMZORI", "UNKNOWN"
]

# ── Normalise ─────────────────────────────────────────────────────────────────
def normalize(landmarks):
    pts   = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    wrist = pts[0]
    ref   = pts[9]
    scale = float(np.linalg.norm(ref - wrist)) or 1.0
    return ((pts - wrist) / scale).flatten().tolist()

# ── Load existing data ────────────────────────────────────────────────────────
if os.path.exists(DATA_PATH):
    with open(DATA_PATH) as f:
        training_data = json.load(f)
    print("Loaded existing training_data.json")
else:
    training_data = {}
    print("No existing training_data.json - creating fresh")

# ── Download MediaPipe model if needed ───────────────────────────────────────
MODEL_PATH = os.path.join(HERE, "hand_landmarker.task")
if not os.path.exists(MODEL_PATH):
    print("Downloading MediaPipe hand landmarker model (~9MB)...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        MODEL_PATH
    )
    print("Downloaded.")

# ── Init MediaPipe detector ───────────────────────────────────────────────────
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    num_hands=1,
    min_hand_detection_confidence=0.65,
    min_hand_presence_confidence=0.60,
    min_tracking_confidence=0.60,
    running_mode=mp_vision.RunningMode.IMAGE,
)
detector = HandLandmarker.create_from_options(options)

# ── Find videos ───────────────────────────────────────────────────────────────
video_files = sorted([
    f for f in os.listdir(args.videos)
    if f.lower().endswith((".mp4", ".mov", ".avi", ".mkv"))
])

if not video_files:
    print("ERROR: No video files found in " + args.videos)
    sys.exit(1)

print("\nFound " + str(len(video_files)) + " video(s): " + str(video_files) + "\n")

total_extracted = 0
total_skipped   = 0

# ── Process each video ────────────────────────────────────────────────────────
for fname in video_files:
    if args.label:
        label = args.label.upper()
    else:
        label = fname.upper().split("_")[0].split(".")[0]

    if label not in VALID_LABELS:
        print("  WARNING: " + fname + " label '" + label + "' not valid - skipping")
        print("  Valid labels: " + str(VALID_LABELS))
        continue

    if label not in training_data:
        training_data[label] = []

    video_path   = os.path.join(args.videos, fname)
    cap          = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps          = cap.get(cv2.CAP_PROP_FPS)

    extracted = 0
    skipped   = 0
    frame_idx = 0

    print("  " + fname + " -> label=" + label + " | " + str(total_frames) + " frames @ " + str(int(fps)) + "fps")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if frame_idx % args.skip != 0:
            continue

        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = detector.detect(mp_image)

        if not result.hand_landmarks:
            skipped += 1
            continue

        lm     = result.hand_landmarks[0]
        normed = normalize(lm)
        training_data[label].append(normed)
        extracted += 1

    cap.release()
    print("    OK: extracted=" + str(extracted) + "  skipped(no hand)=" + str(skipped))
    total_extracted += extracted
    total_skipped   += skipped

detector.close()

# ── Save ──────────────────────────────────────────────────────────────────────
with open(DATA_PATH, "w") as f:
    json.dump(training_data, f)

print("\n--------------------------------------------------")
print("Total samples extracted : " + str(total_extracted))
print("Total frames skipped    : " + str(total_skipped))
print("\ntraining_data.json updated:")
for k, v in training_data.items():
    if v:
        print("  " + k.ljust(16) + ": " + str(len(v)) + " samples")
print("\nSaved -> " + DATA_PATH)
