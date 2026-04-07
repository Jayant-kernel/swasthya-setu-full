"""
train_static.py
===============
Trains a Random Forest classifier on the collected ISL static sign data.
Saves model + label encoder to models/ folder.

Run from isl_feature directory:
  python training/train_static.py
"""

import os
import csv
import json
import numpy as np
import joblib
from collections import Counter
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH    = os.path.join(BASE_DIR, "data_collection", "data", "static_keypoints.csv")
MODELS_DIR  = os.path.join(BASE_DIR, "models")
MODEL_OUT   = os.path.join(MODELS_DIR, "static_rf_model.pkl")
ENCODER_OUT = os.path.join(MODELS_DIR, "static_label_encoder.pkl")

os.makedirs(MODELS_DIR, exist_ok=True)

# ── Load CSV ──────────────────────────────────────────────────────────────────
print("\n=== Loading data ===")
X, y = [], []
with open(CSV_PATH, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        label = row["label"]
        vals  = [float(row[h]) for h in reader.fieldnames[1:]]
        X.append(vals)
        y.append(label)

X = np.array(X)
y = np.array(y)

counts = Counter(y)
print(f"  Total samples : {len(X)}")
print(f"  Features      : {X.shape[1]}")
print(f"  Classes       : {sorted(counts.keys())}")
for label, cnt in sorted(counts.items()):
    print(f"    {label:12s}: {cnt}")

# ── Encode labels ─────────────────────────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)
print(f"\n  Label mapping : {dict(zip(le.classes_, le.transform(le.classes_)))}")

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)
print(f"\n  Train samples : {len(X_train)}")
print(f"  Test samples  : {len(X_test)}")

# ── Train Random Forest ───────────────────────────────────────────────────────
print("\n=== Training Random Forest ===")
rf = RandomForestClassifier(
    n_estimators=500,       # more trees = more stable
    max_depth=None,         # let trees grow fully
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",    # standard best practice
    random_state=42,
    n_jobs=-1,              # use all CPU cores
    class_weight="balanced" # handle any class imbalance
)
rf.fit(X_train, y_train)
print("  Training done.")

# ── Evaluate ──────────────────────────────────────────────────────────────────
print("\n=== Evaluation ===")
y_pred = rf.predict(X_test)
acc    = (y_pred == y_test).mean()
print(f"  Test accuracy : {acc*100:.2f}%")

# Cross-validation for robust estimate
print("\n  Running 5-fold cross-validation...")
cv_scores = cross_val_score(rf, X, y_enc, cv=5, scoring="accuracy", n_jobs=-1)
print(f"  CV scores     : {[f'{s*100:.1f}%' for s in cv_scores]}")
print(f"  CV mean       : {cv_scores.mean()*100:.2f}%")
print(f"  CV std        : {cv_scores.std()*100:.2f}%")

# Per-class report
print("\n=== Per-class Report ===")
report = classification_report(y_test, y_pred, target_names=le.classes_)
print(report)

# Confusion matrix
print("=== Confusion Matrix ===")
cm = confusion_matrix(y_test, y_pred)
print(f"  Labels: {list(le.classes_)}")
print(cm)

# ── Flag any weak class ───────────────────────────────────────────────────────
print("\n=== Class Health Check ===")
report_dict = classification_report(
    y_test, y_pred, target_names=le.classes_, output_dict=True
)
all_ok = True
for cls in le.classes_:
    recall = report_dict[cls]["recall"]
    prec   = report_dict[cls]["precision"]
    if recall < 0.90:
        print(f"  WARNING: {cls:12s} recall={recall*100:.1f}%  < 90% — needs more data")
        all_ok = False
    elif prec < 0.90:
        print(f"  WARNING: {cls:12s} precision={prec*100:.1f}%  < 90% — confused with another sign")
        all_ok = False
    else:
        print(f"  OK:      {cls:12s} recall={recall*100:.1f}%  precision={prec*100:.1f}%")

if all_ok:
    print("\n  All classes >= 90% — model is safe to ship.")
else:
    print("\n  Fix warnings above before using in production.")

# ── Save model ────────────────────────────────────────────────────────────────
print("\n=== Saving model ===")
joblib.dump(rf, MODEL_OUT)
joblib.dump(le, ENCODER_OUT)
print(f"  Model   saved: {MODEL_OUT}")
print(f"  Encoder saved: {ENCODER_OUT}")

# Save class list to JSON for the inference engine
classes_path = os.path.join(MODELS_DIR, "static_classes.json")
with open(classes_path, "w") as f:
    json.dump(list(le.classes_), f)
print(f"  Classes saved: {classes_path}")

print(f"\n=== DONE — Final accuracy: {acc*100:.2f}% ===\n")
