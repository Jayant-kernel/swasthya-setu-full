"""
train.py — ISL v2.0 training pipeline
───────────────────────────────────────────────────────────────────────────────
Trains the 12-class (10 signs + UNCERTAIN + NO_SIGN) MLP on the 98-video
dataset at C:\\Users\\jayan\\Desktop\\vedios\\.

Pipeline:
  1. Walk video dir, parse label from filename (e.g. BUKHAR_1.mp4 -> BUKHAR)
  2. Per frame: MediaPipe Hands -> 126-float feature vector
                (right[63] + left[63], wrist-centred, palm-width normalised)
     — matches islNormalize.js and isl_detector.py exactly
  3. Augment: horizontal flip (swap hands, negate x), gaussian noise (σ=0.005)
  4. Synthesise NO_SIGN samples (zero vector + noise) so the network learns
     the idle state. UNCERTAIN stays reserved (model never trained to emit it,
     but the class index is preserved for runtime use).
  5. Train MLP 126 → 256 → 128 → 12 with dropout + early stopping
  6. Export:
       frontend/isl_model.h5                   (backend Keras)
       frontend/public/tfjs_model/model.json   (frontend TF.js)
       frontend/public/tfjs_model/label_classes.json

Run:
    cd isl_feature/training
    python train.py --video-dir "C:/Users/jayan/Desktop/vedios"
───────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from sklearn.model_selection import train_test_split

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

# ── Labels (must match islInference.js and isl_detector.py) ───────────────────
LABELS = [
    "DARD", "BUKHAR", "SAR-DARD", "PET-DARD", "ULTI",
    "KHANSI", "SANS-TAKLEEF", "SEENE-DARD", "CHAKKAR", "KAMZORI",
    "UNCERTAIN", "NO_SIGN",
]
LABEL_TO_IDX = {lbl: i for i, lbl in enumerate(LABELS)}
TRAINABLE_SIGNS = set(LABELS[:10])  # 10 real signs
NO_SIGN_IDX     = LABEL_TO_IDX["NO_SIGN"]

# ── Config ────────────────────────────────────────────────────────────────────
FRAME_STRIDE   = 2       # sample every Nth frame (videos are short)
NOISE_SIGMA    = 0.005
AUG_PER_SAMPLE = 2       # flip + noise
NO_SIGN_RATIO  = 0.10    # 10% synthetic idle samples
BATCH_SIZE     = 64
EPOCHS         = 80
VAL_SPLIT      = 0.15
RANDOM_SEED    = 42

np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)


# ── Normalisation (mirrors islNormalize.js / isl_detector.py) ─────────────────
def normalize_hand(landmarks_xyz: np.ndarray) -> np.ndarray:
    """landmarks_xyz: (21, 3). Returns (63,) float32."""
    wrist = landmarks_xyz[0]
    mcp   = landmarks_xyz[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    return ((landmarks_xyz - wrist) / scale).flatten().astype(np.float32)


# ── Feature extraction ────────────────────────────────────────────────────────
def extract_video_features(video_path: Path, hands) -> list[np.ndarray]:
    """Return list of 126-float vectors, one per usable frame."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"  [WARN] could not open {video_path.name}")
        return []

    feats: list[np.ndarray] = []
    frame_idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_idx % FRAME_STRIDE != 0:
            frame_idx += 1
            continue
        frame_idx += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        if not res.multi_hand_landmarks:
            continue

        right = np.zeros(63, dtype=np.float32)
        left  = np.zeros(63, dtype=np.float32)
        for i, lm_group in enumerate(res.multi_hand_landmarks):
            handed = res.multi_handedness[i].classification[0].label
            pts = np.array([[lm.x, lm.y, lm.z] for lm in lm_group.landmark],
                           dtype=np.float32)
            normed = normalize_hand(pts)
            if handed == "Right":
                right = normed
            else:
                left = normed
        feats.append(np.concatenate([right, left]))

    cap.release()
    return feats


# ── Augmentation ──────────────────────────────────────────────────────────────
def augment_flip(v: np.ndarray) -> np.ndarray:
    """Swap right/left halves and negate x coordinates."""
    right, left = v[:63].copy(), v[63:].copy()
    def flip_half(h):
        h = h.reshape(21, 3)
        h[:, 0] *= -1.0
        return h.flatten()
    return np.concatenate([flip_half(left), flip_half(right)]).astype(np.float32)

def augment_noise(v: np.ndarray) -> np.ndarray:
    return (v + np.random.normal(0, NOISE_SIGMA, v.shape)).astype(np.float32)


# ── Filename → label ──────────────────────────────────────────────────────────
_FNAME_RE = re.compile(r"^([A-Z\-]+)_\d+", re.IGNORECASE)

def label_from_filename(name: str) -> str | None:
    m = _FNAME_RE.match(Path(name).stem.upper())
    if not m:
        return None
    lbl = m.group(1)
    return lbl if lbl in TRAINABLE_SIGNS else None


# ── Dataset build ─────────────────────────────────────────────────────────────
def build_dataset(video_dir: Path):
    mp_hands = mp.solutions.hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        model_complexity=1,
        min_detection_confidence=0.60,
        min_tracking_confidence=0.50,
    )

    X: list[np.ndarray] = []
    y: list[int] = []
    per_class_counts: dict[str, int] = {lbl: 0 for lbl in TRAINABLE_SIGNS}

    videos = sorted(video_dir.glob("*.mp4"))
    print(f"Found {len(videos)} videos in {video_dir}")

    for vi, vp in enumerate(videos, 1):
        lbl = label_from_filename(vp.name)
        if lbl is None:
            print(f"  [SKIP] {vp.name} — no matching label")
            continue
        feats = extract_video_features(vp, mp_hands)
        print(f"  [{vi:3d}/{len(videos)}] {vp.name:25s} -> {lbl:12s} "
              f"({len(feats)} frames)")
        idx = LABEL_TO_IDX[lbl]
        for f in feats:
            X.append(f);               y.append(idx)
            X.append(augment_noise(f)); y.append(idx)
            X.append(augment_flip(f));  y.append(idx)
        per_class_counts[lbl] += len(feats)

    mp_hands.close()

    # Synthesise NO_SIGN: zero vectors with small noise
    total_real = len(X)
    n_no_sign  = max(int(total_real * NO_SIGN_RATIO), 50)
    for _ in range(n_no_sign):
        X.append(np.random.normal(0, NOISE_SIGMA, 126).astype(np.float32))
        y.append(NO_SIGN_IDX)

    X_arr = np.stack(X)
    y_arr = np.array(y, dtype=np.int64)
    print("\nPer-class raw frame counts:")
    for lbl, c in per_class_counts.items():
        print(f"  {lbl:13s} {c}")
    print(f"  NO_SIGN       {n_no_sign} (synthetic)")
    print(f"Total samples (incl. aug): {len(X_arr)}  shape={X_arr.shape}")
    return X_arr, y_arr


# ── Model ─────────────────────────────────────────────────────────────────────
def build_model(num_classes: int = 12) -> tf.keras.Model:
    m = models.Sequential([
        layers.Input(shape=(126,)),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.35),
        layers.Dense(128, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(64, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])
    m.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return m


# ── Export ────────────────────────────────────────────────────────────────────
def export_model(model: tf.keras.Model, frontend_root: Path):
    h5_path = frontend_root / "isl_model.h5"
    h5_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(h5_path)
    print(f"Saved Keras model -> {h5_path}")

    tfjs_dir = frontend_root / "public" / "tfjs_model"
    tfjs_dir.mkdir(parents=True, exist_ok=True)
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, str(tfjs_dir))
        print(f"Saved TF.js model -> {tfjs_dir}")
    except ImportError:
        print("[WARN] tensorflowjs not installed — skipping TF.js export.")
        print("       pip install tensorflowjs  then re-run, or convert manually:")
        print(f"       tensorflowjs_converter --input_format=keras {h5_path} {tfjs_dir}")

    with open(tfjs_dir / "label_classes.json", "w", encoding="utf-8") as f:
        json.dump(LABELS, f, indent=2)
    print(f"Saved label_classes.json -> {tfjs_dir / 'label_classes.json'}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-dir", default=r"C:/Users/jayan/Desktop/vedios")
    ap.add_argument("--frontend-root", default=None,
                    help="Path to frontend/ (auto-detected if omitted)")
    args = ap.parse_args()

    video_dir = Path(args.video_dir)
    if not video_dir.exists():
        print(f"Video dir not found: {video_dir}")
        sys.exit(1)

    if args.frontend_root:
        frontend_root = Path(args.frontend_root)
    else:
        # isl_feature/training/train.py -> ../../frontend
        frontend_root = Path(__file__).resolve().parents[2] / "frontend"
    print(f"Frontend root: {frontend_root}")

    # 1. Build dataset
    X, y = build_dataset(video_dir)

    # 2. Split
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=VAL_SPLIT, stratify=y, random_state=RANDOM_SEED
    )
    print(f"Train: {X_tr.shape}  Val: {X_val.shape}")

    # 3. Class weights (handle imbalance)
    unique, counts = np.unique(y_tr, return_counts=True)
    total = counts.sum()
    class_weight = {int(c): float(total / (len(unique) * n))
                    for c, n in zip(unique, counts)}
    # Keras requires weight for every class 0..num_classes-1
    for i in range(len(LABELS)):
        class_weight.setdefault(i, 1.0)
    print(f"Class weights: {class_weight}")

    # 4. Train
    model = build_model(num_classes=len(LABELS))
    model.summary()

    cbs = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=12,
                                restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5,
                                    patience=5, min_lr=1e-5),
    ]
    model.fit(
        X_tr, y_tr,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weight,
        callbacks=cbs,
        verbose=2,
    )

    # 5. Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nFinal val accuracy: {val_acc:.4f}   loss: {val_loss:.4f}")

    # 6. Export
    export_model(model, frontend_root)
    print("\nTraining complete.")


if __name__ == "__main__":
    main()
