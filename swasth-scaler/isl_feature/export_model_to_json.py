"""
Export Random Forest model to JSON for browser-side inference.
Run: py -3.11 export_model_to_json.py
"""
import json
import joblib
import numpy as np
import os

MODEL_PATH   = os.path.join(os.path.dirname(__file__), "models", "static_rf_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "models", "static_label_encoder.pkl")
OUTPUT_PATH  = os.path.join(os.path.dirname(__file__), "..", "swasth-scaler", "frontend", "public", "isl_model.json")

def export():
    rf = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)
    classes = list(le.classes_)

    trees = []
    for estimator in rf.estimators_:
        t = estimator.tree_
        tree_data = {
            "children_left":  t.children_left.tolist(),
            "children_right": t.children_right.tolist(),
            "feature":        t.feature.tolist(),
            "threshold":      t.threshold.tolist(),
            "value":          t.value.tolist(),
        }
        trees.append(tree_data)

    model_json = {
        "classes": classes,
        "n_classes": len(classes),
        "trees": trees,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(model_json, f)

    size_mb = os.path.getsize(OUTPUT_PATH) / 1024 / 1024
    print(f"Model exported to: {OUTPUT_PATH}")
    print(f"   Classes: {classes}")
    print(f"   Trees: {len(trees)}")
    print(f"   File size: {size_mb:.2f} MB")

if __name__ == "__main__":
    export()
