/**
 * ISLCamera.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full detection pipeline — webcam → MediaPipe → gates → TF.js → callback.
 *
 * Gate execution order:
 *   0. No hands detected          → suppress all output
 *   1. Pocket / session mode      → restrict sign pool
 *   2. Hand count gate            → block wrong-hand-count signs
 *   3. Zone gate                  → block signs at wrong body location
 *   4. MLP inference (126 floats) → softmax over 11 classes
 *   5. Confidence floor < 0.97   → treat as UNKNOWN
 *   6. UNKNOWN class              → suppress output
 *   7. Sliding window smoother    → 8 frames
 *   8. Lock + fire gate           → 24 frames + 800ms + 97% confidence
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeTwoHands } from '../utils/normalize'
import { PredictionSmoother } from '../utils/smoothing'
import { loadModel, predict, LABELS } from '../utils/inferenceEngine'
import { loadMediaPipeHands } from '../utils/loadMediaPipeHands'

const TEAL = '#0F6E56'
const CONFIDENCE_MIN  = 0.97
const LOCK_FRAMES     = 24     // ~0.8s at 30fps
const FIRE_DELAY_MS   = 800    // extra ms after lock before firing

// ── Hand count groups ────────────────────────────────────────────────────────
const ONE_HAND_SIGNS = new Set(['DARD', 'BUKHAR', 'PET-DARD', 'ULTI', 'KHANSI', 'SEENE-DARD', 'CHAKKAR'])
const TWO_HAND_SIGNS = new Set(['SAR-DARD', 'SANS-TAKLEEF', 'KAMZORI'])

// ── Body zone table (wrist Y, 0=top 1=bottom, ±0.05 tolerance applied inside gate) ──
const ZONE_TABLE = {
  'SAR-DARD':     [0.00, 0.38],
  'BUKHAR':       [0.00, 0.32],
  'CHAKKAR':      [0.00, 0.38],
  'SEENE-DARD':   [0.28, 0.58],
  'SANS-TAKLEEF': [0.28, 0.58],
  'KHANSI':       [0.28, 0.58],
  'ULTI':         [0.20, 0.52],
  'DARD':         [0.00, 1.00],   // pain can be anywhere — never zone-reject
  'PET-DARD':     [0.48, 0.78],
  'KAMZORI':      [0.52, 0.88],
}
const ZONE_TOLERANCE = 0.05

// ── Pocket detection ─────────────────────────────────────────────────────────
const POCKET_FRAMES = 60   // 2s at 30fps of consistent hand count before locking mode

// ── Possibility filter — hard gate based on hand count ───────────────────────
/**
 * Get which signs are physically possible given the number of hands detected.
 * Returns a Set of sign names that can possibly be signed right now.
 *
 * @param {number} handsDetected - 0, 1, or 2
 * @returns {Set<string>} possible sign names, or empty set if handsDetected === 0
 */
function getPossibleSigns(handsDetected) {
  if (handsDetected === 1) return ONE_HAND_SIGNS
  if (handsDetected === 2) return TWO_HAND_SIGNS
  return new Set()  // 0 hands → nothing possible
}

/**
 * Zero out probabilities for impossible signs and re-normalize.
 *
 * @param {Object} prediction - { label, confidence, scores: [11 floats] }
 * @param {Set<string>} possibleSigns - from getPossibleSigns()
 * @param {Array<string>} LABELS - class names in order
 * @returns {Object} - prediction with zeroed/renormalized scores
 */
function applyPossibilityFilter(prediction, possibleSigns, LABELS) {
  if (possibleSigns.size === 0) {
    // No hands → all probabilities zero
    return { ...prediction, label: 'UNKNOWN', confidence: 0, scores: new Array(LABELS.length).fill(0) }
  }

  const filtered = prediction.scores.map((score, idx) => {
    const label = LABELS[idx]
    return possibleSigns.has(label) ? score : 0
  })

  // Re-normalize remaining scores to sum to 1
  const sum = filtered.reduce((a, b) => a + b, 0)
  const normalized = sum > 0 ? filtered.map(s => s / sum) : filtered

  // Find new best class
  let bestIdx = 0
  for (let i = 1; i < normalized.length; i++) {
    if (normalized[i] > normalized[bestIdx]) bestIdx = i
  }

  return {
    label: LABELS[bestIdx] ?? 'UNKNOWN',
    confidence: normalized[bestIdx],
    scores: normalized,
  }
}

// ── MediaPipe skeleton topology ──────────────────────────────────────────────
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

// ── Gate 2: Hand count gate ───────────────────────────────────────────────────
function handCountGate(label, handsDetected) {
  if (handsDetected === 1 && TWO_HAND_SIGNS.has(label)) {
    console.log('[GATE REJECTED]', label, 'reason: needs 2 hands, only 1 detected')
    return 'UNKNOWN'
  }
  if (handsDetected >= 2 && ONE_HAND_SIGNS.has(label)) {
    console.log('[GATE REJECTED]', label, 'reason: needs 1 hand, 2 detected')
    return 'UNKNOWN'
  }
  return label
}

// ── Gate 3: Body zone gate ────────────────────────────────────────────────────
function zoneGate(label, wristY) {
  const zone = ZONE_TABLE[label]
  if (!zone) return label   // UNKNOWN / unmapped — pass through
  const [lo, hi] = zone
  if (wristY < lo - ZONE_TOLERANCE || wristY > hi + ZONE_TOLERANCE) {
    console.log('[ZONE REJECTED]', label, 'wristY=' + wristY.toFixed(3),
      'allowed=[' + lo + ',' + hi + ']')
    return 'UNKNOWN'
  }
  return label
}

// ── Gate 1: Session / pocket mode gate ───────────────────────────────────────
function sessionModeGate(label, sessionMode) {
  if (sessionMode === 'SINGLE_HAND' && TWO_HAND_SIGNS.has(label)) {
    console.log('[GATE REJECTED]', label, 'reason: session locked to single-hand mode')
    return 'UNKNOWN'
  }
  if (sessionMode === 'BOTH_HANDS' && ONE_HAND_SIGNS.has(label)) {
    console.log('[GATE REJECTED]', label, 'reason: session locked to both-hands mode')
    return 'UNKNOWN'
  }
  return label
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const modelRef   = useRef(null)
  const smoothRef  = useRef(new PredictionSmoother({ windowSize: 8 }))
  const lockRef    = useRef({ label: null, count: 0, readyAt: null })
  const firedSetRef = useRef(new Set())

  // Pocket detection counters (before first sign fires)
  const pocketCountRef   = useRef({ count: 0, lastHandCount: -1 })
  const firstSignFiredRef = useRef(false)

  const [status,      setStatus]      = useState('loading')
  const [prediction,  setPrediction]  = useState(null)
  const [handVisible, setHandVisible] = useState(false)
  const [sentence,    setSentence]    = useState([])
  const [sessionMode, setSessionMode] = useState('AUTO')  // 'AUTO' | 'SINGLE_HAND' | 'BOTH_HANDS'

  // ── Load TF.js model ────────────────────────────────────────────────────────
  useEffect(() => {
    loadModel('/tfjs_model/model.json')
      .then(m => { modelRef.current = m; setStatus('ready') })
      .catch(err => { console.error('[ISLCamera] model load failed:', err); setStatus('no-model') })
  }, [])

  // ── MediaPipe results callback ──────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.clientWidth  || canvas.width
    const H = canvas.clientHeight || canvas.height
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const handsDetected = results.multiHandLandmarks?.length ?? 0

    // ── Gate 0: No hands ──────────────────────────────────────────────────────
    if (handsDetected === 0) {
      setHandVisible(false)
      setPrediction(null)
      lockRef.current = { label: null, count: 0, readyAt: null }
      pocketCountRef.current = { count: 0, lastHandCount: 0 }
      return
    }

    setHandVisible(true)

    // Draw skeletons for all detected hands
    for (const lm of results.multiHandLandmarks) {
      drawSkeleton(ctx, lm, canvas.width, canvas.height)
    }

    // ── Gate 1: Pocket / session mode detection ───────────────────────────────
    // Before first sign fires, track consistent hand count to auto-detect mode
    if (!firstSignFiredRef.current) {
      const pc = pocketCountRef.current
      if (pc.lastHandCount === handsDetected) {
        pc.count++
        if (pc.count >= POCKET_FRAMES) {
          const newMode = handsDetected === 1 ? 'SINGLE_HAND' : 'BOTH_HANDS'
          setSessionMode(prev => prev !== newMode ? newMode : prev)
        }
      } else {
        // Hand count changed — reset counter, exit any locked mode
        pc.count = 0
        pc.lastHandCount = handsDetected
        setSessionMode('AUTO')
      }
    }

    if (!modelRef.current) return

    // ── Normalize: 126 floats (right[63] + left[63]) ─────────────────────────
    const features = normalizeTwoHands(
      results.multiHandLandmarks,
      results.multiHandedness
    )

    // Get dominant hand wrist Y for zone gate (right preferred, else left)
    let dominantWristY = 0.5
    if (results.multiHandedness && results.multiHandLandmarks.length > 0) {
      let rightIdx = results.multiHandedness.findIndex(h => h.label === 'Right')
      let idx = rightIdx >= 0 ? rightIdx : 0
      dominantWristY = results.multiHandLandmarks[idx][0].y
    }

    // ── MLP inference ─────────────────────────────────────────────────────────
    let raw = predict(modelRef.current, features)

    // ── POSSIBILITY FILTER: Hard gate — only allow physically possible signs ────
    const possibleSigns = getPossibleSigns(handsDetected)
    raw = applyPossibilityFilter(raw, possibleSigns, LABELS)

    // ── Gate 5: Confidence floor ──────────────────────────────────────────────
    if (raw.confidence < CONFIDENCE_MIN) {
      raw.label = 'UNKNOWN'
    }

    // ── Gate 2: Hand count gate (now redundant but kept for clarity) ──────────
    raw.label = handCountGate(raw.label, handsDetected)

    // ── Gate 1 (apply): Session mode gate ────────────────────────────────────
    raw.label = sessionModeGate(raw.label, sessionMode)

    // ── Gate 3: Zone gate ─────────────────────────────────────────────────────
    if (raw.label !== 'UNKNOWN') {
      raw.label = zoneGate(raw.label, dominantWristY)
    }

    // ── Gate 6: UNKNOWN suppression ──────────────────────────────────────────
    if (raw.label === 'UNKNOWN' || firedSetRef.current.has(raw.label)) {
      setPrediction(null)
      lockRef.current = { label: null, count: 0, readyAt: null }
      smoothRef.current.reset?.()
      return
    }

    // ── Gate 7: Sliding window smoother ──────────────────────────────────────
    const smoothed = smoothRef.current.update(raw)

    if (smoothed.label === 'UNKNOWN' || firedSetRef.current.has(smoothed.label)) {
      setPrediction(null)
      lockRef.current = { label: null, count: 0, readyAt: null }
      return
    }

    setPrediction(smoothed)

    // ── Gate 8: Lock + fire ───────────────────────────────────────────────────
    if (smoothed.confidence >= CONFIDENCE_MIN) {
      const lock = lockRef.current
      const now  = Date.now()

      if (lock.label === smoothed.label) {
        lock.count++
        if (lock.count === LOCK_FRAMES) lock.readyAt = now + FIRE_DELAY_MS
        if (lock.count >= LOCK_FRAMES && lock.readyAt && now >= lock.readyAt) {
          firedSetRef.current.add(smoothed.label)
          firstSignFiredRef.current = true
          onSymptomDetected?.(smoothed.label)
          lockRef.current = { label: null, count: 0, readyAt: null }
          smoothRef.current.reset?.()
        }
      } else {
        lockRef.current = { label: smoothed.label, count: 1, readyAt: null }
      }
    } else {
      lockRef.current = { label: null, count: 0, readyAt: null }
    }
  }, [onSymptomDetected, sessionMode])

  // ── Init webcam + MediaPipe ───────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = null
    let handsInstance = null
    let stream = null

    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      video.srcObject = stream
      await video.play()

      const Hands = await loadMediaPipeHands()
      handsInstance = new Hands({
        locateFile: (file) =>
          `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${file}`,
      })
      handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      })
      handsInstance.onResults(onResults)

      async function tick() {
        if (video.readyState >= 2) await handsInstance.send({ image: video })
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    init().catch(console.error)

    return () => {
      if (rafId)         cancelAnimationFrame(rafId)
      if (stream)        stream.getTracks().forEach(t => t.stop())
      if (handsInstance) handsInstance.close()
    }
  }, [onResults])

  // ── Draw skeleton ─────────────────────────────────────────────────────────
  function drawSkeleton(ctx, lm, w, h) {
    const mx = (x) => (1 - x) * w
    ctx.strokeStyle = 'rgba(15,110,86,0.75)'
    ctx.lineWidth = 2
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(mx(lm[a].x), lm[a].y * h)
      ctx.lineTo(mx(lm[b].x), lm[b].y * h)
      ctx.stroke()
    })
    lm.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(mx(p.x), p.y * h, i === 0 ? 7 : 4, 0, Math.PI * 2)
      ctx.fillStyle  = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth  = 1.5
      ctx.fill(); ctx.stroke()
    })
  }

  // ── Sentence helpers ──────────────────────────────────────────────────────
  const confirmed = prediction?.confidence >= CONFIDENCE_MIN ? prediction : null

  const addWord = () => { if (confirmed) setSentence(p => [...p, confirmed.label]) }
  const clear   = () => {
    setSentence([])
    firedSetRef.current.clear()
    lockRef.current = { label: null, count: 0, readyAt: null }
    pocketCountRef.current = { count: 0, lastHandCount: -1 }
    firstSignFiredRef.current = false
    setSessionMode('AUTO')
    smoothRef.current.reset?.()
  }
  const speak = () => {
    if (!sentence.length) return
    const u = new SpeechSynthesisUtterance(sentence.join(' '))
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Camera card */}
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        background: '#0f172a', aspectRatio: '4/3', maxHeight: 420,
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          muted playsInline
        />
        <canvas
          ref={canvasRef} width={640} height={480}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <StatusBadge status={status} handVisible={handVisible} />
        {sessionMode !== 'AUTO' && (
          <SessionModeBadge mode={sessionMode} />
        )}
        {confirmed && (
          <PredictionOverlay
            label={confirmed.label}
            confidence={confirmed.confidence}
            lockCount={lockRef.current.count}
            lockMax={LOCK_FRAMES}
          />
        )}
      </div>

      {/* Sentence builder */}
      <SentenceBar
        sentence={sentence}
        currentLabel={confirmed?.label ?? null}
        onAdd={addWord} onClear={clear} onSpeak={speak}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, handVisible }) {
  const cfg = status === 'loading'  ? { dot: '#f59e0b', text: 'Loading model...' }
    : status === 'no-model'         ? { dot: '#ef4444', text: 'No model — run training first' }
    : handVisible                   ? { dot: TEAL,      text: '● Hand detected' }
    :                                 { dot: '#64748b',  text: 'Show your hand' }
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      borderRadius: 20, padding: '5px 12px',
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block',
        boxShadow: handVisible && status === 'ready' ? `0 0 0 3px ${TEAL}44` : 'none',
      }} />
      <span style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 600 }}>{cfg.text}</span>
    </div>
  )
}

function SessionModeBadge({ mode }) {
  const label = mode === 'SINGLE_HAND' ? 'Single hand mode' : 'Both hands mode'
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
      borderRadius: 20, padding: '4px 10px',
      color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600,
    }}>
      {label}
    </div>
  )
}

function PredictionOverlay({ label, confidence, lockCount, lockMax }) {
  const pct    = Math.min(lockCount / lockMax, 1)
  const locked = pct >= 1
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: locked ? 'rgba(15,110,86,0.92)' : 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)', borderRadius: 16,
      padding: '10px 22px', textAlign: 'center', minWidth: 180,
      transition: 'background 0.3s',
    }}>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginTop: 2 }}>
        {(confidence * 100).toFixed(0)}% confidence
      </div>
      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2, background: '#fff',
          width: `${pct * 100}%`, transition: 'width 0.1s linear',
        }} />
      </div>
    </div>
  )
}

function SentenceBar({ sentence, currentLabel, onAdd, onClear, onSpeak }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1rem 1.25rem',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
          SENTENCE BUILDER
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={onAdd}   disabled={!currentLabel} bg="#0F6E56">
            + Add {currentLabel ? `"${currentLabel}"` : '...'}
          </Btn>
          <Btn onClick={onSpeak} disabled={!sentence.length} bg="#3b82f6">Speak</Btn>
          <Btn onClick={onClear} disabled={!sentence.length} bg="#ef4444">Clear</Btn>
        </div>
      </div>
      <div style={{
        minHeight: 44, background: '#f8fafc', borderRadius: 10,
        padding: '0.6rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      }}>
        {sentence.length === 0
          ? <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Hold a sign to detect, then click Add
            </span>
          : sentence.map((w, i) => (
            <span key={i} style={{
              background: 'rgba(15,110,86,0.12)', color: '#0F6E56',
              borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: '0.85rem',
            }}>{w}</span>
          ))
        }
      </div>
    </div>
  )
}

function Btn({ onClick, disabled, bg, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#e2e8f0' : bg,
      color: disabled ? '#94a3b8' : '#fff',
      border: 'none', borderRadius: 8, padding: '5px 12px',
      fontSize: '0.72rem', fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}
