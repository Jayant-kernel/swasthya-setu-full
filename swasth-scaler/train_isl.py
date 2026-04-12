# -*- coding: utf-8 -*-
"""
train_isl.py - Train 10-sign ISL symptom MLP

Usage:
    py -3.11 train_isl.py
    py -3.11 train_isl.py --epochs 100 --batch 32
"""

import argparse
import json
import os
import sys

import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument("--data",   default=None)
parser.add_argument("--epochs", default=80, type=int)
parser.add_argument("--batch",  default=32, type=int)
args = parser.parse_args()

HERE        = os.path.dirname(os.path.abspath(__file__))
DATA_PATH   = args.data or os.path.join(HERE, "frontend", "training_data.json")
LABELS_PATH = os.path.join(HERE, "frontend", "public", "label_classes.json")
H5_OUT      = os.path.join(HERE, "frontend", "isl_model.h5")

with open(LABELS_PATH) as f:
    ALL_LABELS = json.load(f)

print("\nLabels (" + str(len(ALL_LABELS)) + "): " + str(ALL_LABELS))

with open(DATA_PATH) as f:
    raw = json.load(f)

for label, samples in raw.items():
    if samples:
        assert len(samples[0]) == 63, label + " has wrong length: " + str(len(samples[0]))

X, y = [], []
label_to_idx = {lbl: i for i, lbl in enumerate(ALL_LABELS)}

print("\nSample counts:")
for lbl in ALL_LABELS:
    samples = raw.get(lbl, [])
    if not samples:
        print("  " + lbl.ljust(16) + ": EMPTY - skipping")
        continue
    idx = label_to_idx[lbl]
    for sample in samples:
        X.append(sample)
        y.append(idx)
    print("  " + lbl.ljust(16) + ": " + str(len(samples)) + " samples")

if not X:
    print("\nERROR: No training data.")
    sys.exit(1)

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)
print("\nTotal: " + str(len(X)) + " samples across " + str(len(set(y))) + " classes")

perm = np.random.permutation(len(X))
X, y = X[perm], y[perm]

import tensorflow as tf
from tensorflow import keras

NUM_CLASSES = len(ALL_LABELS)

model = keras.Sequential([
    keras.layers.Dense(128, activation="relu", input_shape=(63,)),
    keras.layers.BatchNormalization(momentum=0.99, epsilon=0.001),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation="relu"),
    keras.layers.BatchNormalization(momentum=0.99, epsilon=0.001),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(NUM_CLASSES, activation="softmax"),
], name="isl_gesture_mlp")

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
model.summary()

print("\nTraining for " + str(args.epochs) + " epochs, batch " + str(args.batch) + "...")
history = model.fit(
    X, y,
    epochs=args.epochs,
    batch_size=args.batch,
    validation_split=0.15,
    verbose=1,
)

# Per-class evaluation
print("\n-- Per-class recall (on full training set) --")
preds   = np.argmax(model.predict(X, verbose=0), axis=1)
present = sorted(set(y.tolist()))

for idx in present:
    lbl    = ALL_LABELS[idx]
    mask   = y == idx
    recall = np.mean(preds[mask] == idx)
    print("  " + lbl.ljust(16) + " recall: " + "{:.3f}".format(recall) + "  (" + str(np.sum(mask)) + " samples)")

# Critical gate check
CRITICAL = ["SANS-TAKLEEF", "SEENE-DARD"]
gate_pass = True
for lbl in CRITICAL:
    if lbl not in label_to_idx:
        continue
    idx  = label_to_idx[lbl]
    mask = y == idx
    if not np.any(mask):
        print("\n  WARNING: " + lbl + " has no samples - cannot check gate")
        continue
    recall = float(np.mean(preds[mask] == idx))
    gate   = recall >= 0.97
    status = "PASS" if gate else "FAIL - DO NOT DEPLOY"
    print("\n  Critical gate " + lbl + ": recall=" + "{:.3f}".format(recall) + "  " + status)
    if not gate:
        gate_pass = False

if not gate_pass:
    print("\n  WARNING: Critical sign gate failed. Collect more data.")

# Save
model.save(H5_OUT)
print("\nModel saved -> " + H5_OUT)
print("Final val_accuracy: " + "{:.4f}".format(history.history["val_accuracy"][-1]))
print("\nNext: convert to TF.js:")
print("  py -3.11 -m tensorflowjs.converters.converter --input_format=keras " + H5_OUT + " frontend/public/tfjs_model/")
