/**
 * inferenceEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles TensorFlow.js model loading and single-sample inference.
 *
 * • Uses WebGL backend for GPU-accelerated inference
 * • Wraps all tensor operations in tf.tidy() to prevent memory leaks
 * • Returns { label, confidence, scores } for every prediction
 *
 * Label order must match the order used during Python training.
 * If you retrain, update LABELS to match your label_encoder.classes_.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

// ── Label set — MUST match Python LabelEncoder order ─────────────────────────
// Update this if you add or rename gesture classes.
export const LABELS = [
    'BREATHLESS',
    'COUGH',
    'DIZZINESS',
    'FEVER',
    'PAIN',
    'VOMIT',
    'WEAKNESS',
]

let _modelLoaded = false

/**
 * Load and warm-up the TF.js model.
 * Call once at boot. Returns the loaded model.
 *
 * @param {string} url   Path to model.json (e.g. '/tfjs_model/model.json')
 * @returns {Promise<tf.LayersModel>}
 */
export async function loadModel(url = '/tfjs_model/model.json') {
    // Prefer WebGL; fall back to CPU wasm if unavailable
    try {
        await tf.setBackend('webgl')
        await tf.ready()
        console.log('[Inference] TF.js backend:', tf.getBackend())
    } catch {
        await tf.setBackend('cpu')
        console.warn('[Inference] WebGL unavailable, using CPU backend')
    }

    const model = await tf.loadLayersModel(url)

    // Warm-up pass — eliminates first-prediction latency spike
    tf.tidy(() => {
        const dummy = tf.zeros([1, 63])
        model.predict(dummy)
    })

    _modelLoaded = true
    console.log('[Inference] Model loaded and warmed up')
    return model
}

/**
 * Run a single prediction.
 *
 * @param {tf.LayersModel}  model     Loaded TF.js model
 * @param {Float32Array}    features  Normalised landmarks, length 63
 * @returns {{ label: string, confidence: number, scores: number[] }}
 */
export function predict(model, features) {
    if (!model || !_modelLoaded) {
        return { label: LABELS[0], confidence: 0, scores: [] }
    }

    return tf.tidy(() => {
        // Shape: [1, 63]
        const input = tf.tensor2d([Array.from(features)], [1, 63])
        const output = model.predict(input)              // shape [1, NUM_CLASSES]
        const scores = Array.from(output.dataSync())     // copy out before tidy cleans up

        // Argmax
        let bestIdx = 0
        let bestScore = 0
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > bestScore) {
                bestScore = scores[i]
                bestIdx = i
            }
        }

        return {
            label: LABELS[bestIdx] ?? `CLASS_${bestIdx}`,
            confidence: bestScore,
            scores,
        }
    })
}