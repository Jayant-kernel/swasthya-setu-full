# ISL Model Training — Instructions for Next Session

## Context

Project: **Swasthya Setu** — rural healthcare triage app for ASHA workers.
Repo root: `swasth-scaler/`

The ISL (Indian Sign Language) pipeline is:
**Webcam → MediaPipe Hands (21 landmarks) → normalize to Float32[63] → TF.js MLP → one of 7 symptom labels**

---

## Files That Already Exist — DO NOT OVERWRITE

| File | What it is |
|------|-----------|
| `frontend/public/tfjs_model/model.json` | TF.js Sequential MLP, input `[null, 63]`, 7 output classes, converted from Keras 2.15 |
| `frontend/public/tfjs_model/group1-shard1of1.bin` | Weights shard for the above |
| `frontend/public/label_classes.json` | 7 class labels in this exact order: `["BREATHLESS","COUGH","DIZZINESS","FEVER","PAIN","VOMIT","WEAKNESS"]` |
| `frontend/isl_model.h5` | Original Keras H5 model (same architecture) |
| `frontend/training_data.json` | Training dataset — dict with 7 keys, one per label, each key holds a list of samples |

---

## Current Model Architecture (match this exactly when retraining)

```
Input: (63,)
Dense(128, activation='relu')
BatchNormalization(momentum=0.99, epsilon=0.001)
Dropout(0.3)
Dense(64, activation='relu')
BatchNormalization(momentum=0.99, epsilon=0.001)
Dropout(0.2)
Dense(7, activation='softmax')
```

Loss: `sparse_categorical_crossentropy`
Optimizer: `adam`
Output order MUST match label_classes.json: `BREATHLESS=0, COUGH=1, DIZZINESS=2, FEVER=3, PAIN=4, VOMIT=5, WEAKNESS=6`

---

## Training Data Format

`frontend/training_data.json` is structured as:

```json
{
  "BREATHLESS": [ [63 floats], [63 floats], ... ],
  "COUGH":      [ [63 floats], [63 floats], ... ],
  "DIZZINESS":  [ [63 floats], [63 floats], ... ],
  "FEVER":      [ [63 floats], [63 floats], ... ],
  "PAIN":       [],
  "VOMIT":      [ [63 floats], [63 floats], ... ],
  "WEAKNESS":   [ [63 floats], [63 floats], ... ]
}
```

Each array of 63 floats = 21 MediaPipe hand landmarks × (x, y, z), normalized relative to wrist (landmark 0), scaled by distance from wrist to middle-finger MCP (landmark 9).

**Currently:** PAIN key exists but is empty (samples were cleared intentionally). The user will add new JSON data for 4 gestures first to test, then add the rest.

---

## Your Tasks

### Task 1 — Create `train_isl.py`

Create this file at: `swasth-scaler/train_isl.py`

The script must:
1. Load `frontend/training_data.json`
2. Skip any label whose sample list is empty
3. Build label→index mapping using the fixed order from `frontend/public/label_classes.json` (do NOT sort dynamically — order must stay fixed)
4. Train a Keras Sequential MLP matching the architecture above exactly
5. Save trained model to `frontend/isl_model.h5`
6. Print per-class accuracy after training

```python
# Expected usage:
python train_isl.py
# or with a custom data file:
python train_isl.py --data path/to/your_data.json
```

### Task 2 — Shell command to convert to TF.js

After training, run this to replace the TF.js model files:

```bash
tensorflowjs_converter \
  --input_format=keras \
  swasth-scaler/frontend/isl_model.h5 \
  swasth-scaler/frontend/public/tfjs_model/
```

This overwrites `model.json` and `group1-shard1of1.bin` in place.

Install if needed: `pip install tensorflowjs`

### Task 3 — Verify data before running

Before running `train_isl.py`, check the user's JSON file matches this format:
- Top-level: a dict with gesture label strings as keys
- Each value: a list of samples
- Each sample: a flat list of exactly 63 floats

Run this quick check:
```python
import json
with open('frontend/training_data.json') as f:
    data = json.load(f)
for label, samples in data.items():
    if samples:
        assert len(samples[0]) == 63, f"{label} sample has wrong length: {len(samples[0])}"
        print(f"{label}: {len(samples)} samples — OK")
    else:
        print(f"{label}: EMPTY (will be skipped in training)")
```

---

## What NOT to touch

- `frontend/src/components/ISLCamera.jsx` — frontend camera + inference UI
- `frontend/src/pages/ISLPage.jsx` — ISL page
- `backend/main.py` line 331 — WebSocket `/ws/isl` endpoint
- `frontend/public/label_classes.json` — label order is fixed, do not change

---

## Current Status

- User has data for **4 gestures only** (will provide the JSON file)
- Goal: train on those 4, test that the pipeline works end-to-end
- Remaining 3 gestures will be added later once testing passes
- PAIN samples were intentionally cleared — user will re-collect PAIN data fresh
