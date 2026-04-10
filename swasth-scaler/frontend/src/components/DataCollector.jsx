/**
 * DataCollector.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Capture & label hand-landmark data for training.
 *
 * Route: add  <Route path="/data-collector" element={<DataCollector/>}/>
 *        to your router (App.jsx / router config) temporarily.
 *
 * Workflow:
 *   1. Select a class (e.g. FEVER)
 *   2. Hold the sign — skeleton confirms detection
 *   3. Press Space or click "Capture" — saves the 63-feature vector
 *   4. Aim for ≥ 150 samples per class
 *   5. Export → training_data.json → run train_model.py
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeLandmarks } from '../utils/normalize'
import { loadMediaPipeHands } from '../utils/loadMediaPipeHands'

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
  const latestLm = useRef(null)   // last detected landmarks

  const [selectedClass, setSelectedClass] = useState('FEVER')
  const [data, setData] = useState({})
  const [handReady, setHandReady] = useState(false)
  const [flash, setFlash] = useState(false)

  const counts = CLASS_LIST.reduce((a, c) => ({ ...a, [c]: (data[c]?.length || 0) }), {})
  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  // ── MediaPipe results ────────────────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    // Sync canvas to the video's actual rendered pixel size (not the container)
    const W = video ? video.clientWidth : canvas.clientWidth
    const H = video ? video.clientHeight : canvas.clientHeight
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
    }
    ctx.clearRect(0, 0, W, H)

    if (!results.multiHandLandmarks?.length) {
      setHandReady(false); latestLm.current = null; return
    }
    const lm = results.multiHandLandmarks[0]
    setHandReady(true); latestLm.current = lm

    // Draw skeleton — mirror X to match the flipped video display
    const mx = (x) => (1 - x) * W
    ctx.strokeStyle = 'rgba(15,110,86,0.8)'; ctx.lineWidth = 2
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(mx(lm[a].x), lm[a].y * H)
      ctx.lineTo(mx(lm[b].x), lm[b].y * H)
      ctx.stroke()
    })
    lm.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(mx(p.x), p.y * H, i === 0 ? 6 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
      ctx.fill(); ctx.stroke()
    })
  }, [])

  // ── Init webcam + MediaPipe (dynamic import avoids Vite CJS issues) ───────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId = null
    let handsInstance = null
    let stream = null

    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }, audio: false,
      })
      video.srcObject = stream
      await video.play()

      const Hands = await loadMediaPipeHands()
      handsInstance = new Hands({
        locateFile: (file) =>
          `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${file}`,
      })
      handsInstance.setOptions({
        maxNumHands: 1, modelComplexity: 1,
        minDetectionConfidence: 0.7, minTrackingConfidence: 0.6,
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
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (handsInstance) handsInstance.close()
    }
  }, [onResults])

  // ── Capture ─────────────────────────────────────────────────────────────────
  const capture = useCallback(() => {
    if (!latestLm.current) return
    const features = normalizeLandmarks(latestLm.current)
    setData(prev => ({
      ...prev,
      [selectedClass]: [...(prev[selectedClass] || []), Array.from(features)],
    }))
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }, [selectedClass])

  // Space bar shortcut
  useEffect(() => {
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); capture() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [capture])

  // ── Export JSON ──────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'training_data.json' }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc', padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ color: TEAL, fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          Data Collection Tool
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>

          {/* Camera — video + canvas wrapped together so canvas covers exactly the video */}
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#0f172a' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <video ref={videoRef}
                style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
                muted playsInline
              />
              <canvas ref={canvasRef} width={640} height={480} style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
              }} />
              {/* Flash overlay on capture */}
              {flash && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(15,110,86,0.35)',
                  pointerEvents: 'none',
                }} />
              )}
              <div style={{
                position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: '6px 16px',
                color: handReady ? '#4ade80' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {handReady ? '✓ Hand detected' : 'Show your hand'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Class selector */}
            <div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8',
                letterSpacing: '0.05em', marginBottom: 6
              }}>SELECT CLASS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CLASS_LIST.map(cls => (
                  <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                    padding: '7px 12px', borderRadius: 9, fontWeight: 700,
                    fontSize: '0.78rem', cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: selectedClass === cls ? TEAL : '#e2e8f0',
                    background: selectedClass === cls ? 'rgba(15,110,86,0.1)' : '#fff',
                    color: selectedClass === cls ? TEAL : '#475569',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{cls}</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.68rem' }}>
                      {counts[cls]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Capture */}
            <button onClick={capture} disabled={!handReady} style={{
              padding: '11px', borderRadius: 11, fontWeight: 800, fontSize: '0.88rem',
              background: handReady ? TEAL : '#e2e8f0',
              color: handReady ? '#fff' : '#94a3b8',
              border: 'none', cursor: handReady ? 'pointer' : 'not-allowed',
            }}>
              📸 Capture sample
              <div style={{ fontSize: '0.62rem', fontWeight: 400, marginTop: 2, opacity: 0.75 }}>
                or press Space
              </div>
            </button>

            {/* Stats */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                DATASET TOTAL
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: TEAL, lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>samples</div>
            </div>

            {/* Export */}
            <button onClick={exportJSON} disabled={total === 0} style={{
              padding: '9px', borderRadius: 10, fontWeight: 700, fontSize: '0.78rem',
              background: total > 0 ? '#1e293b' : '#e2e8f0',
              color: total > 0 ? '#fff' : '#94a3b8',
              border: 'none', cursor: total > 0 ? 'pointer' : 'not-allowed',
            }}>
              ⬇ Export training_data.json
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}