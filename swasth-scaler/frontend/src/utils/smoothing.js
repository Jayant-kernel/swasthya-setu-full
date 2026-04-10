/**
 * smoothing.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PredictionSmoother uses a sliding window of recent predictions and returns
 * the label with the highest cumulative confidence over that window.
 *
 * This prevents flickering when the model oscillates between two similar
 * gesture classes frame-to-frame.
 *
 * Usage:
 *   const smoother = new PredictionSmoother({ windowSize: 8 })
 *   const result   = smoother.update({ label: 'FEVER', confidence: 0.91 })
 *   // → { label: 'FEVER', confidence: 0.88 }   (averaged over window)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class PredictionSmoother {
    /**
     * @param {object} opts
     * @param {number} opts.windowSize   - number of frames to average over (default 8)
     */
    constructor({ windowSize = 8 } = {}) {
        this.windowSize = windowSize
        this.window = []   // Array<{ label: string, confidence: number }>
    }

    /**
     * Push a new raw prediction and return the smoothed result.
     * @param {{ label: string, confidence: number }} raw
     * @returns {{ label: string, confidence: number }}
     */
    update(raw) {
        this.window.push(raw)
        if (this.window.length > this.windowSize) {
            this.window.shift()
        }

        // Accumulate confidence per label over the window
        const scores = {}
        for (const { label, confidence } of this.window) {
            scores[label] = (scores[label] || 0) + confidence
        }

        // Pick the label with the highest total score
        let bestLabel = raw.label
        let bestScore = 0
        for (const [label, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score
                bestLabel = label
            }
        }

        // Average confidence for the winning label
        const winEntries = this.window.filter(p => p.label === bestLabel)
        const avgConf = winEntries.reduce((s, p) => s + p.confidence, 0) / winEntries.length

        return { label: bestLabel, confidence: avgConf }
    }

    reset() {
        this.window = []
    }
}

/**
 * Simple debounce — wrap any function so it only runs after
 * `delay` ms of inactivity.
 */
export function debounce(fn, delay = 300) {
    let timer = null
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}