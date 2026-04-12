/**
 * inferenceEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TF.js model loader + single-sample inference.
 *
 * ⚠️  LABELS must match label_classes.json produced by train_model.py exactly
 *      (same order, same casing). Update this array whenever you retrain.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

/**
 * Class label names in order (0–10).
 * Must match label_classes.json and training data order exactly.
 * Exported so ISLCamera.jsx can use it for possibility filtering.
 */
export const LABELS = [
    'DARD',         // Pain          — HIGH urgency
    'BUKHAR',       // Fever         — HIGH urgency
    'SAR-DARD',     // Headache      — MEDIUM urgency
    'PET-DARD',     // Stomach Pain  — HIGH urgency
    'ULTI',         // Vomiting      — MEDIUM urgency
    'KHANSI',       // Cough         — MEDIUM urgency
    'SANS-TAKLEEF', // Breathless    — CRITICAL urgency
    'SEENE-DARD',   // Chest Pain    — CRITICAL urgency
    'CHAKKAR',      // Dizziness     — MEDIUM urgency
    'KAMZORI',      // Weakness      — MEDIUM urgency
    'UNKNOWN',      // Reserved: low-confidence open-set rejection
]

let _ready = false

/**
 * Load model from the given URL and warm it up.
 * Call once at app boot. Resolves with the loaded tf.LayersModel.
 *
 * @param {string} url  e.g. '/tfjs_model/model.json'
 */
export async function loadModel(url = '/tfjs_model/model.json') {
    // Try WebGL (GPU); fall back to CPU if unavailable (e.g. headless test env)
    try {
        await tf.setBackend('webgl')
        await tf.ready()
    } catch {
        await tf.setBackend('cpu')
        console.warn('[inference] WebGL unavailable — using CPU backend')
    }
    console.log('[inference] TF.js backend:', tf.getBackend())

    console.log('[inference] loading model from:', url)
    const model = await tf.loadLayersModel(url)
    console.log('[inference] model loaded, inputs:', model.inputs)

    // Warm-up eliminates the JIT compilation spike on the first real prediction
    // Input is 126 floats (two hands: right[63] + left[63])
    tf.tidy(() => model.predict(tf.zeros([1, 126])))

    _ready = true
    console.log('[inference] model ready')
    return model
}

/**
 * Run inference on a single normalised sample.
 *
 * @param {tf.LayersModel}  model
 * @param {Float32Array}    features  length 126 (right[63] + left[63])
 * @returns {{ label: string, confidence: number, scores: number[] }}
 */
export function predict(model, features) {
    if (!model || !_ready) {
        return { label: LABELS[0], confidence: 0, scores: [] }
    }

    return tf.tidy(() => {
        const input = tf.tensor2d([Array.from(features)], [1, 126])
        const output = model.predict(input)              // [1, NUM_CLASSES]
        const scores = Array.from(output.dataSync())     // copy before tidy cleans up

        let bestIdx = 0
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > scores[bestIdx]) bestIdx = i
        }

        return {
            label: LABELS[bestIdx] ?? `CLASS_${bestIdx}`,
            confidence: scores[bestIdx],
            scores,
        }
    })
}