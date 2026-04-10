// Wrist-relative, scale-invariant landmark normalizer
/**
 * normalize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts raw MediaPipe landmark objects into a flat, scale-invariant
 * Float32Array[63] suitable for the MLP model.
 *
 * Strategy:
 *   1. Translate so wrist (landmark 0) is at origin
 *   2. Scale by the span between wrist and middle-finger MCP (landmark 9)
 *      → makes the feature vector independent of hand distance from camera
 *   3. Flatten [x0,y0,z0, x1,y1,z1, …, x20,y20,z20]
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @param {Array<{x: number, y: number, z: number}>} landmarks
 *   21 landmark objects from MediaPipe Hands results
 * @returns {Float32Array} length 63
 */
export function normalizeLandmarks(landmarks) {
    if (!landmarks || landmarks.length !== 21) {
        return new Float32Array(63).fill(0)
    }

    // 1. Origin = wrist
    const wrist = landmarks[0]

    // 2. Scale reference = distance wrist → middle MCP (landmark 9)
    const ref = landmarks[9]
    const dx = ref.x - wrist.x
    const dy = ref.y - wrist.y
    const dz = ref.z - wrist.z
    const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1  // avoid /0

    // 3. Build normalised flat array
    const out = new Float32Array(63)
    for (let i = 0; i < 21; i++) {
        const lm = landmarks[i]
        out[i * 3 + 0] = (lm.x - wrist.x) / scale
        out[i * 3 + 1] = (lm.y - wrist.y) / scale
        out[i * 3 + 2] = (lm.z - wrist.z) / scale
    }

    return out
}

/**
 * Converts a Float32Array[63] back to a readable array of {x,y,z} objects.
 * Useful for data-collection debugging.
 */
export function featuresTo3D(features) {
    const out = []
    for (let i = 0; i < 21; i++) {
        out.push({
            x: features[i * 3],
            y: features[i * 3 + 1],
            z: features[i * 3 + 2],
        })
    }
    return out
}   