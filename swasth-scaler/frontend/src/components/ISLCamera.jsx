/**
 * ISLCamera.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Core detection component. Manages:
 *   • Webcam access via HTML5 getUserMedia
 *   • MediaPipe Hands landmark detection (21 points per hand)
 *   • Canvas overlay drawing
 *   • Normalization → TF.js inference → smoothing → callback
 *
 * Props:
 *   onSymptomDetected(englishName: string) — called when a gesture is confirmed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeLandmarks } from '../utils/normalize'
import { PredictionSmoother } from '../utils/smoothing'
import { loadModel, predict } from '../utils/inferenceEngine'

// ── visual constants ──────────────────────────────────────────────────────────
const TEAL = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.15)'
const CONFIDENCE_MIN = 0.80   // must exceed this to surface a prediction
const LOCK_FRAMES = 18     // hold for N consecutive frames before firing

// Finger connection pairs for canvas drawing (MediaPipe topology)
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],         // index
  [0, 9], [9, 10], [10, 11], [11, 12],    // middle
  [0, 13], [13, 14], [14, 15], [15, 16],  // ring
  [0, 17], [17, 18], [18, 19], [19, 20],  // pinky
  [5, 9], [9, 13], [13, 17],            // palm cross
]

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)    // MediaPipe Hands instance
  const modelRef = useRef(null)    // TF.js model
  const smoothRef = useRef(new PredictionSmoother({ windowSize: 8 }))
  const rafRef = useRef(null)    // requestAnimationFrame id
  const lockRef = useRef({ label: null, count: 0 }) // consecutive-frame lock
  const lastFire = useRef(null)    // last fired label (prevents repeat firing)

  const [status, setStatus] = useState('idle')   // idle | loading | ready | error
  const [prediction, setPrediction] = useState(null)     // { label, confidence }
  const [sentence, setSentence] = useState([])       // running sentence builder
  const [handVisible, setHandVisible] = useState(false)

  // ── 1. Boot: load model + init MediaPipe ────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function boot() {
      setStatus('loading')
      try {
        // Load TF.js model from /public/tfjs_model/model.json
        modelRef.current = await loadModel('/tfjs_model/model.json')

        // Init MediaPipe Hands
        const { Hands } = await import('@mediapipe/hands')
        const hands = new Hands({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.6,
        })
        hands.onResults(onMediaPipeResults)
        handsRef.current = hands

        if (!cancelled) setStatus('ready')
      } catch (err) {
        console.error('[ISLCamera] boot error:', err)
        if (!cancelled) setStatus('error')
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  // ── 2. Start webcam once component mounts ───────────────────────────────────
  useEffect(() => {
    let stream = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        console.error('[ISLCamera] camera error:', err)
        setStatus('error')
      }
    }

    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── 3. rAF loop — feeds frames to MediaPipe ─────────────────────────────────
  const tick = useCallback(async () => {
    const video = videoRef.current
    const hands = handsRef.current
    if (video && hands && video.readyState >= 2) {
      await hands.send({ image: video })
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (status === 'ready') {
      rafRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [status, tick])

  // ── 4. MediaPipe results handler ─────────────────────────────────────────────
  const onMediaPipeResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (!results.multiHandLandmarks?.length) {
      setHandVisible(false)
      setPrediction(null)
      lockRef.current = { label: null, count: 0 }
      return
    }

    setHandVisible(true)
    const landmarks = results.multiHandLandmarks[0]  // first hand only

    // Draw skeleton overlay
    drawLandmarks(ctx, landmarks, width, height)

    // Normalize → predict
    if (modelRef.current) {
      const features = normalizeLandmarks(landmarks)  // Float32Array[63]
      const result = predict(modelRef.current, features)  // { label, confidence }

      // Smoothing filter
      const smoothed = smoothRef.current.update(result)
      setPrediction(smoothed)

      // Consecutive-frame lock: only fire callback after LOCK_FRAMES stable frames
      if (smoothed.confidence >= CONFIDENCE_MIN) {
        const lock = lockRef.current
        if (lock.label === smoothed.label) {
          lock.count++
          if (lock.count >= LOCK_FRAMES && lastFire.current !== smoothed.label) {
            lastFire.current = smoothed.label
            onSymptomDetected?.(smoothed.label)
            // Reset so same sign can fire again after a gap
            setTimeout(() => { lastFire.current = null }, 2500)
          }
        } else {
          lockRef.current = { label: smoothed.label, count: 1 }
        }
      } else {
        lockRef.current = { label: null, count: 0 }
      }
    }
  }, [onSymptomDetected])

  // ── 5. Draw landmarks on canvas ──────────────────────────────────────────────
  function drawLandmarks(ctx, landmarks, w, h) {
    // Draw connections
    ctx.strokeStyle = 'rgba(15,110,86,0.7)'
    ctx.lineWidth = 2
    CONNECTIONS.forEach(([a, b]) => {
      const pa = landmarks[a], pb = landmarks[b]
      ctx.beginPath()
      ctx.moveTo(pa.x * w, pa.y * h)
      ctx.lineTo(pb.x * w, pb.y * h)
      ctx.stroke()
    })

    // Draw joint dots
    landmarks.forEach((lm, i) => {
      ctx.beginPath()
      ctx.arc(lm.x * w, lm.y * h, i === 0 ? 7 : 4, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.fill()
      ctx.stroke()
    })
  }

  // ── 6. Sentence builder helpers ───────────────────────────────────────────────
  const addToSentence = () => {
    if (prediction?.label) {
      setSentence(prev => [...prev, prediction.label])
    }
  }
  const clearSentence = () => setSentence([])
  const speakSentence = () => {
    if (!sentence.length) return
    const text = sentence.join(' ')
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.9
    window.speechSynthesis.speak(utt)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Camera card */}
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        background: '#0f172a', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        aspectRatio: '4/3', maxHeight: 420,
      }}>
        {/* Mirrored video */}
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          muted playsInline
        />

        {/* Canvas overlay — must match video dimensions */}
        <canvas
          ref={canvasRef}
          width={640} height={480}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            transform: 'scaleX(-1)',   // mirror to match video
            pointerEvents: 'none',
          }}
        />

        {/* Status badge */}
        <StatusBadge status={status} handVisible={handVisible} />

        {/* Prediction overlay */}
        {prediction && prediction.confidence >= CONFIDENCE_MIN && (
          <PredictionOverlay
            label={prediction.label}
            confidence={prediction.confidence}
            lockCount={lockRef.current.count}
            lockMax={LOCK_FRAMES}
          />
        )}
      </div>

      {/* Sentence builder bar */}
      <SentenceBuilder
        sentence={sentence}
        onAdd={addToSentence}
        onClear={clearSentence}
        onSpeak={speakSentence}
        currentLabel={prediction?.confidence >= CONFIDENCE_MIN ? prediction.label : null}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, handVisible }) {
  const map = {
    idle: { color: '#64748b', text: 'Initialising…' },
    loading: { color: '#f59e0b', text: 'Loading model…' },
    ready: { color: handVisible ? '#0F6E56' : '#64748b', text: handVisible ? 'Hand detected' : 'Show your hand' },
    error: { color: '#ef4444', text: 'Error — check console' },
  }
  const { color, text } = map[status] || map.idle

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      borderRadius: 20, padding: '5px 12px',
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block',
        boxShadow: status === 'ready' && handVisible ? `0 0 0 3px ${color}44` : 'none'
      }} />
      <span style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 600 }}>{text}</span>
    </div>
  )
}

function PredictionOverlay({ label, confidence, lockCount, lockMax }) {
  const pct = Math.min(lockCount / lockMax, 1)
  const isReady = pct >= 1

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: isReady ? 'rgba(15,110,86,0.92)' : 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      borderRadius: 16, padding: '10px 22px', textAlign: 'center',
      minWidth: 180, transition: 'background 0.3s',
    }}>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginTop: 2 }}>
        {(confidence * 100).toFixed(0)}% confidence
      </div>
      {/* Lock progress bar */}
      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct * 100}%`, background: '#fff',
          transition: 'width 0.1s linear',
        }} />
      </div>
    </div>
  )
}

function SentenceBuilder({ sentence, onAdd, onClear, onSpeak, currentLabel }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1rem 1.25rem',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
          SENTENCE BUILDER
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onAdd} disabled={!currentLabel} style={btnStyle('#0F6E56', !currentLabel)}>
            + Add "{currentLabel || '…'}"
          </button>
          <button onClick={onSpeak} disabled={!sentence.length} style={btnStyle('#3b82f6', !sentence.length)}>
            🔊 Speak
          </button>
          <button onClick={onClear} disabled={!sentence.length} style={btnStyle('#ef4444', !sentence.length)}>
            Clear
          </button>
        </div>
      </div>

      <div style={{
        minHeight: 44, background: '#f8fafc', borderRadius: 10,
        padding: '0.6rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      }}>
        {sentence.length === 0
          ? <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Hold a sign to detect → click "Add" to build sentence</span>
          : sentence.map((word, i) => (
            <span key={i} style={{
              background: 'rgba(15,110,86,0.12)', color: '#0F6E56',
              borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: '0.85rem',
            }}>{word}</span>
          ))
        }
      </div>
    </div>
  )
}

function btnStyle(bg, disabled) {
  return {
    background: disabled ? '#e2e8f0' : bg,
    color: disabled ? '#94a3b8' : '#fff',
    border: 'none', borderRadius: 8,
    padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
  }
}