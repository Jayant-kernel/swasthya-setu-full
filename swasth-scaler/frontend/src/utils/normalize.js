/**
 * normalize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts 21 raw MediaPipe landmarks → Float32Array[63] that is:
 *   • Translation-invariant  (subtract wrist position)
 *   • Scale-invariant        (divide by wrist→middle-MCP distance)
 *
 * This means the model is immune to where the hand is in frame and
 * how far it is from the camera.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @param {Array<{x:number, y:number, z:number}>} landmarks  21 points
 * @returns {Float32Array}  length 63  [x0,y0,z0, x1,y1,z1, …]
 */
export function normalizeLandmarks(landmarks) {
    if (!landmarks || landmarks.length !== 21) return new Float32Array(63)

    const wrist = landmarks[0]
    const ref = landmarks[9]   // middle-finger MCP — good scale reference

    const dx = ref.x - wrist.x
    const dy = ref.y - wrist.y
    const dz = ref.z - wrist.z
    const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

    const out = new Float32Array(63)
    for (let i = 0; i < 21; i++) {
        out[i * 3] = (landmarks[i].x - wrist.x) / scale
        out[i * 3 + 1] = (landmarks[i].y - wrist.y) / scale
        out[i * 3 + 2] = (landmarks[i].z - wrist.z) / scale
    }
    return out
}