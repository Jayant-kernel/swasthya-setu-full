/**
 * smoothing.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sliding-window prediction smoother.
 * Keeps the last N frames and picks the label with highest total confidence,
 * preventing single-frame flicker when the model oscillates between classes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class PredictionSmoother {
    constructor({ windowSize = 8 } = {}) {
        this.windowSize = windowSize
        this.window = []
    }

    /**
     * @param {{ label: string, confidence: number }} raw
     * @returns {{ label: string, confidence: number }}
     */
    update(raw) {
        this.window.push(raw)
        if (this.window.length > this.windowSize) this.window.shift()

        // Sum confidence per label over the window
        const scores = {}
        for (const { label, confidence } of this.window) {
            scores[label] = (scores[label] || 0) + confidence
        }

        // Best label by cumulative score
        const bestLabel = Object.entries(scores).reduce(
            (best, [lbl, s]) => s > best[1] ? [lbl, s] : best,
            ['', 0]
        )[0]

        // Average confidence of winning label only
        const winners = this.window.filter(p => p.label === bestLabel)
        const avgConf = winners.reduce((s, p) => s + p.confidence, 0) / winners.length

        return { label: bestLabel, confidence: avgConf }
    }

    reset() { this.window = [] }
}