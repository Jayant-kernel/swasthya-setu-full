import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH   = os.path.join(os.path.dirname(__file__), "frontend", "training_data.json")
LABELS_PATH = os.path.join(os.path.dirname(__file__), "frontend", "public", "label_classes.json")
H5_OUT      = os.path.join(os.path.dirname(__file__), "frontend", "isl_model.h5")

# ── Load fixed label order ────────────────────────────────────────────────────
with open(LABELS_PATH) as f:
    ALL_LABELS = json.load(f)   # ["BREATHLESS","COUGH","DIZZINESS","FEVER","PAIN","VOMIT","WEAKNESS"]

# ── Load training data ────────────────────────────────────────────────────────
with open(DATA_PATH) as f:
    raw = json.load(f)

X, y = [], []
label_to_idx = {lbl: i for i, lbl in enumerate(ALL_LABELS)}

for label, samples in raw.items():
    if not samples:
        print(f"  Skipping {label} — no samples")
        continue
    idx = label_to_idx[label]
    for sample in samples:
        X.append(sample)
        y.append(idx)

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)

print(f"\nLoaded {len(X)} total samples across {len(set(y))} classes")
for lbl, idx in label_to_idx.items():
    count = np.sum(y == idx)
    if count > 0:
        print(f"  {lbl}: {count} samples")

# ── Shuffle ───────────────────────────────────────────────────────────────────
perm = np.random.permutation(len(X))
X, y = X[perm], y[perm]

# ── Build model (same architecture as existing) ───────────────────────────────
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(63,)),
    keras.layers.BatchNormalization(momentum=0.99, epsilon=0.001),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.BatchNormalization(momentum=0.99, epsilon=0.001),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(len(ALL_LABELS), activation='softmax'),  # dynamic — matches label_classes.json
], name="isl_gesture_mlp")

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ── Train ─────────────────────────────────────────────────────────────────────
print("\nTraining...")
history = model.fit(
    X, y,
    epochs=60,
    batch_size=32,
    validation_split=0.15,
    verbose=1
)

# ── Save ──────────────────────────────────────────────────────────────────────
model.save(H5_OUT)
print(f"\nModel saved to: {H5_OUT}")
print(f"Final val_accuracy: {history.history['val_accuracy'][-1]:.4f}")
