/**
 * DataCollector.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone tool for capturing hand-landmark training data.
 * Use this to build / expand your gesture dataset before training.
 *
 * Workflow:
 *   1. Select a gesture class (e.g. "FEVER")
 *   2. Hold the sign in front of the camera
 *   3. Click "Capture sample" (or press Space) → saves normalised features
 *   4. Repeat for all classes
 *   5. Click "Export JSON" → downloads training_data.json
 *
 * The exported JSON has shape:
 *   { "FEVER": [[f0,f1,…,f62], …], "COUGH": [[…], …], … }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeLandmarks } from '../utils/normalize'

const TEAL = '#0F6E56'
const CLASS_LIST = ['FEVER', 'COUGH', 'PAIN', 'VOMIT', 'WEAKNESS', 'DIZZINESS', 'BREATHLESS']

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

export default function DataCollector() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const latestRef = useRef(null)    // latest detected landmarks
  const rafRef = useRef(null)

  const [selectedClass, setSelectedClass] = useState('FEVER')
  const [data, setData] = useState({})  // { className: [[…],…] }
  const [flash, setFlash] = useState(false)
  const [handReady, setHandReady] = useState(false)

  // Count per class
  const counts = CLASS_LIST.reduce((acc, c) => ({
    ...acc, [c]: (data[c] || []).length,
  }), {})

  // ── Boot camera + MediaPipe ──────────────────────────────────────────────────
  useEffect(() => {
    let stream = null

    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      videoRef.current.srcObject = stream
      videoRef.current.play()

      const { Hands } = await import('@mediapipe/hands')
      const hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })
      hands.setOptions({
        maxNumHands: 1, modelComplexity: 1,
        minDetectionConfidence: 0.7, minTrackingConfidence: 0.6
      })
      hands.onResults((results) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (results.multiHandLandmarks?.length) {
          setHandReady(true)
          latestRef.current = results.multiHandLandmarks[0]
          drawSkeleton(ctx, latestRef.current, canvas.width, canvas.height)
        } else {
          setHandReady(false)
          latestRef.current = null
        }
      })
      handsRef.current = hands
    }

    init().catch(console.error)

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── rAF loop ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const v = videoRef.current, h = handsRef.current
      if (v && h && v.readyState >= 2) h.send({ image: v })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Capture one sample ────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    if (!latestRef.current) return
    const features = normalizeLandmarks(latestRef.current)
    setData(prev => ({
      ...prev,
      [selectedClass]: [...(prev[selectedClass] || []), Array.from(features)],
    }))
    // Flash visual feedback
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
  }, [selectedClass])

  // Space bar shortcut
  useEffect(() => {
    const handler = (e) => { if (e.code === 'Space') { e.preventDefault(); capture() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [capture])

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'training_data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Skeleton drawing ──────────────────────────────────────────────────────────
  function drawSkeleton(ctx, landmarks, w, h) {
    ctx.strokeStyle = 'rgba(15,110,86,0.8)'
    ctx.lineWidth = 2
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
      ctx.stroke()
    })
    landmarks.forEach((lm, i) => {
      ctx.beginPath()
      ctx.arc(lm.x * w, lm.y * h, i === 0 ? 6 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
      ctx.fill(); ctx.stroke()
    })
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h2 style={{ color: TEAL, fontWeight: 900, fontSize: '1.4rem', marginBottom: '1.25rem' }}>
        Data Collection Tool
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>

        {/* Camera */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0f172a' }}>
          <video ref={videoRef} style={{ width: '100%', transform: 'scaleX(-1)', display: 'block' }} muted playsInline />
          <canvas ref={canvasRef} width={640} height={480}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              transform: 'scaleX(-1)', pointerEvents: 'none'
            }} />
          {flash && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(15,110,86,0.35)',
              borderRadius: 16, pointerEvents: 'none'
            }} />
          )}
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: '6px 16px',
            color: handReady ? '#4ade80' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700
          }}>
            {handReady ? '✓ Hand detected' : 'Show your hand'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Class selector */}
          <div>
            <label style={{
              fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8',
              letterSpacing: '0.05em', display: 'block', marginBottom: 6
            }}>SELECT CLASS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CLASS_LIST.map(cls => (
                <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                  padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', border: '1.5px solid',
                  borderColor: selectedClass === cls ? TEAL : '#e2e8f0',
                  background: selectedClass === cls ? 'rgba(15,110,86,0.1)' : '#fff',
                  color: selectedClass === cls ? TEAL : '#475569',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{cls}</span>
                  <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.7rem' }}>
                    {counts[cls]} samples
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Capture button */}
          <button onClick={capture} disabled={!handReady} style={{
            padding: '12px', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem',
            background: handReady ? TEAL : '#e2e8f0',
            color: handReady ? '#fff' : '#94a3b8',
            border: 'none', cursor: handReady ? 'pointer' : 'not-allowed',
          }}>
            📸 Capture sample
            <div style={{ fontSize: '0.65rem', fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
              or press Space
            </div>
          </button>

          {/* Stats */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              DATASET STATS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: TEAL }}>{total}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>total samples</div>
          </div>

          {/* Export */}
          <button onClick={exportJSON} disabled={total === 0} style={{
            padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem',
            background: total > 0 ? '#1e293b' : '#e2e8f0',
            color: total > 0 ? '#fff' : '#94a3b8',
            border: 'none', cursor: total > 0 ? 'pointer' : 'not-allowed',
          }}>
            ⬇️ Export training_data.json
          </button>
        </div>
      </div>
    </div>
  )
}