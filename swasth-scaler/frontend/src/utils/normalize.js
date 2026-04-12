/**
 * normalize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts raw MediaPipe landmarks → Float32Array[126]:
 *   • Right hand: landmarks[0] → 63 floats
 *   • Left hand:  landmarks[1] → 63 floats  (zeros if absent)
 *   • Each hand: translation-invariant (subtract wrist) + scale-invariant
 *     (divide by wrist→middle-MCP distance)
 *
 * Single-hand callers can still use normalizeLandmarks() for 63-float output.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Normalize a single hand's 21 landmarks → Float32Array[63].
 * Returns 63 zeros if landmarks is null/undefined/wrong length.
 *
 * @param {Array<{x:number,y:number,z:number}>|null} landmarks
 * @returns {Float32Array} length 63
 */
export function normalizeLandmarks(landmarks) {
    if (!landmarks || landmarks.length !== 21) return new Float32Array(63)

    const wrist = landmarks[0]
    const ref   = landmarks[9]   // middle-finger MCP — stable scale reference

    const dx = ref.x - wrist.x
    const dy = ref.y - wrist.y
    const dz = ref.z - wrist.z
    const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

    const out = new Float32Array(63)
    for (let i = 0; i < 21; i++) {
        out[i * 3]     = (landmarks[i].x - wrist.x) / scale
        out[i * 3 + 1] = (landmarks[i].y - wrist.y) / scale
        out[i * 3 + 2] = (landmarks[i].z - wrist.z) / scale
    }
    return out
}

/**
 * Normalize two hands → Float32Array[126].
 *
 * MediaPipe returns multiHandLandmarks[] and multiHandedness[] in the same
 * index order. Pass both arrays here so we can slot right/left correctly.
 *
 * Layout: [right_hand_63_floats | left_hand_63_floats]
 * Missing hand slot is filled with 63 zeros.
 *
 * @param {Array}  multiHandLandmarks   results.multiHandLandmarks
 * @param {Array}  multiHandedness      results.multiHandedness
 * @returns {Float32Array} length 126
 */
export function normalizeTwoHands(multiHandLandmarks, multiHandedness) {
    const out = new Float32Array(126)   // zeros by default for missing hands

    if (!multiHandLandmarks || multiHandLandmarks.length === 0) return out

    let rightLm = null
    let leftLm  = null

    for (let i = 0; i < multiHandLandmarks.length; i++) {
        // MediaPipe labels from the model's perspective (mirrored camera):
        // "Right" in multiHandedness = user's LEFT hand in selfie view, and vice versa.
        // We use the raw label as-is — consistent between training and inference.
        const label = multiHandedness?.[i]?.label ?? 'Right'
        if (label === 'Right') rightLm = multiHandLandmarks[i]
        else                   leftLm  = multiHandLandmarks[i]
    }

    // If only one hand detected assign it to the appropriate slot
    if (multiHandLandmarks.length === 1 && !rightLm && !leftLm) {
        rightLm = multiHandLandmarks[0]
    }

    const right63 = normalizeLandmarks(rightLm)
    const left63  = normalizeLandmarks(leftLm)

    out.set(right63, 0)    // floats 0–62
    out.set(left63,  63)   // floats 63–125
    return out
}
