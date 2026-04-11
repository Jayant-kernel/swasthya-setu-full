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

// Order must exactly match sklearn LabelEncoder output from training.
// Python sorts class names alphabetically by default → alphabetical here too.
export const LABELS = [
    'BREATHLESS',
    'COUGH',
    'DIZZINESS',
    'FEVER',
    'PAIN',
    'VOMIT',
    'WEAKNESS',
    'UNKNOWN',
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
    tf.tidy(() => model.predict(tf.zeros([1, 63])))

    _ready = true
    console.log('[inference] model ready')
    return model
}

/**
 * Run inference on a single normalised sample.
 *
 * @param {tf.LayersModel}  model
 * @param {Float32Array}    features  length 63
 * @returns {{ label: string, confidence: number, scores: number[] }}
 */
export function predict(model, features) {
    if (!model || !_ready) {
        return { label: LABELS[0], confidence: 0, scores: [] }
    }

    return tf.tidy(() => {
        const input = tf.tensor2d([Array.from(features)], [1, 63])
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