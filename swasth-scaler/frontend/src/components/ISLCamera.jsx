/**
 * ISLCamera.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full detection pipeline — webcam → MediaPipe → TF.js → callback.
 *
 * IMPORTANT — package versions that work together:
 *   npm install @mediapipe/hands@0.4.1646424915
 *   npm install @mediapipe/camera_utils@0.3.1640029074
 *   npm install @tensorflow/tfjs@4.20.0
 *   npm install @tensorflow/tfjs-backend-webgl@4.20.0
 *
 * Why these exact versions?
 *   - @mediapipe/hands 0.4.x ships its own WASM/bin files and can self-host
 *     them via locateFile → unpkg (correct JS MIME, unlike jsdelivr for WASM).
 *   - @mediapipe/camera_utils handles getUserMedia + the rAF send loop so we
 *     don't reinvent it or hit race conditions with video.readyState.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeLandmarks } from '../utils/normalize'
import { PredictionSmoother } from '../utils/smoothing'
import { loadModel, predict } from '../utils/inferenceEngine'
import { loadMediaPipeHands } from '../utils/loadMediaPipeHands'

const TEAL = '#0F6E56'
const CONFIDENCE_MIN = 0.80
const LOCK_FRAMES = 18   // frames a prediction must hold before firing

// MediaPipe 21-landmark connection topology
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const modelRef = useRef(null)
  const smoothRef = useRef(new PredictionSmoother({ windowSize: 8 }))
  const lockRef = useRef({ label: null, count: 0 })
  const lastFireRef = useRef(null)

  const [status, setStatus] = useState('loading')   // loading | ready | no-model
  const [prediction, setPrediction] = useState(null)
  const [handVisible, setHandVisible] = useState(false)
  const [sentence, setSentence] = useState([])

  // ── Load TF.js model ────────────────────────────────────────────────────────
  useEffect(() => {
    loadModel('/tfjs_model/model.json')
      .then(m => { modelRef.current = m; setStatus('ready') })
      .catch(() => { setStatus('no-model') })
  }, [])

  // ── MediaPipe results callback ──────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    // Sync canvas internal resolution to its actual rendered size
    const W = canvas.clientWidth || canvas.width
    const H = canvas.clientHeight || canvas.height
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.multiHandLandmarks?.length) {
      setHandVisible(false)
      setPrediction(null)
      lockRef.current = { label: null, count: 0 }
      return
    }

    setHandVisible(true)
    const lm = results.multiHandLandmarks[0]
    drawSkeleton(ctx, lm, canvas.width, canvas.height)

    if (!modelRef.current) return

    const features = normalizeLandmarks(lm)
    const raw = predict(modelRef.current, features)
    const smoothed = smoothRef.current.update(raw)
    setPrediction(smoothed)

    if (smoothed.confidence >= CONFIDENCE_MIN) {
      const lock = lockRef.current
      if (lock.label === smoothed.label) {
        lock.count++
        if (lock.count >= LOCK_FRAMES && lastFireRef.current !== smoothed.label) {
          lastFireRef.current = smoothed.label
          onSymptomDetected?.(smoothed.label)
          setTimeout(() => { lastFireRef.current = null }, 2500)
        }
      } else {
        lockRef.current = { label: smoothed.label, count: 1 }
      }
    } else {
      lockRef.current = { label: null, count: 0 }
    }
  }, [onSymptomDetected])

  // ── Init webcam + MediaPipe Hands (dynamic import avoids Vite CJS issues) ───
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = null
    let handsInstance = null
    let stream = null

    async function init() {
      // 1. Start webcam
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      video.srcObject = stream
      await video.play()

      // 2. Load MediaPipe Hands once (script-injected, cached across components)
      const Hands = await loadMediaPipeHands()
      handsInstance = new Hands({
        locateFile: (file) =>
          `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${file}`,
      })
      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      })
      handsInstance.onResults(onResults)

      // 3. rAF loop — send each frame to MediaPipe
      async function tick() {
        if (video.readyState >= 2) {
          await handsInstance.send({ image: video })
        }
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    init().catch(console.error)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (handsInstance) handsInstance.close()
    }
  }, [onResults])

  // ── Draw skeleton overlay ───────────────────────────────────────────────────
  function drawSkeleton(ctx, lm, w, h) {
    // Mirror X to match the flipped video display
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
      ctx.fillStyle = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.fill(); ctx.stroke()
    })
  }

  // ── Sentence builder helpers ────────────────────────────────────────────────
  const confirmed = prediction?.confidence >= CONFIDENCE_MIN ? prediction : null

  const addWord = () => { if (confirmed) setSentence(p => [...p, confirmed.label]) }
  const clear = () => setSentence([])
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
        {/* Video is mirrored so it feels like a mirror to the user */}
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          muted playsInline
        />
        {/* Canvas overlay — X coords are flipped in drawSkeleton to match mirrored video */}
        <canvas
          ref={canvasRef} width={640} height={480}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
          }}
        />
        <StatusBadge status={status} handVisible={handVisible} />
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
  const cfg = status === 'loading' ? { dot: '#f59e0b', text: 'Loading model…' }
    : status === 'no-model' ? { dot: '#ef4444', text: 'No model — run training first' }
      : handVisible ? { dot: TEAL, text: '● Hand detected' }
        : { dot: '#64748b', text: 'Show your hand' }
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

function PredictionOverlay({ label, confidence, lockCount, lockMax }) {
  const pct = Math.min(lockCount / lockMax, 1)
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
          <Btn onClick={onAdd} disabled={!currentLabel} bg="#0F6E56">
            + Add {currentLabel ? `"${currentLabel}"` : '…'}
          </Btn>
          <Btn onClick={onSpeak} disabled={!sentence.length} bg="#3b82f6">🔊 Speak</Btn>
          <Btn onClick={onClear} disabled={!sentence.length} bg="#ef4444">Clear</Btn>
        </div>
      </div>
      <div style={{
        minHeight: 44, background: '#f8fafc', borderRadius: 10,
        padding: '0.6rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      }}>
        {sentence.length === 0
          ? <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            Hold a sign to detect → click "Add" to build a sentence
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