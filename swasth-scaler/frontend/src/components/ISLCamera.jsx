/**
 * ISLCamera.jsx
 * =============
 * Webcam component that sends frames to the ISL WebSocket backend,
 * shows a real-time confidence bar, and calls onSymptomDetected()
 * when a sign is confirmed.
 *
 * Props:
 *   onSymptomDetected(symptomEnglish: string) — called on confirmation
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/isl'
const FRAME_INTERVAL_MS = 100   // send 10 frames/sec
const CONFIRM_COOLDOWN_MS = 2000 // wait 2s before allowing next detection

const TEAL = '#0F6E56'

// Short 440Hz confirmation chime via Web Audio API
function playChime() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 440
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch (_) {}
}

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef       = useRef(null)
  const canvasRef      = useRef(null)  // hidden canvas for frame capture
  const wsRef          = useRef(null)
  const intervalRef    = useRef(null)
  const cooldownRef    = useRef(false)

  const [result, setResult]         = useState(null)   // latest WS result
  const [confirmed, setConfirmed]   = useState(null)   // last confirmed sign
  const [wsStatus, setWsStatus]     = useState('connecting') // connecting|open|closed
  const [cameraError, setCameraError] = useState(null)

  // ── Start webcam ──────────────────────────────────────────────────────────
  useEffect(() => {
    let stream = null
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(s => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(() => setCameraError('Camera permission denied'))

    return () => {
      // Stop all tracks and clear video element
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen  = () => setWsStatus('open')
    ws.onclose = () => setWsStatus('closed')
    ws.onerror = () => setWsStatus('closed')

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        if (data.error || data.reset) return
        setResult(data)

        // Confirmed + not in cooldown → trigger
        if (data.confirmed && data.english && !cooldownRef.current) {
          cooldownRef.current = true
          playChime()
          setConfirmed({ english: data.english, odia: data.odia })
          onSymptomDetected?.(data.english)
          // Reset WS buffer
          ws.send(JSON.stringify({ type: 'reset' }))
          // Clear confirmed banner after 2s
          setTimeout(() => {
            setConfirmed(null)
            cooldownRef.current = false
          }, CONFIRM_COOLDOWN_MS)
        }
      } catch (_) {}
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [onSymptomDetected])

  // ── Frame sending loop ────────────────────────────────────────────────────
  const sendFrame = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ws     = wsRef.current
    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return
    if (video.readyState < 2) return  // not loaded yet

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = reader.result.split(',')[1]
        ws.send(JSON.stringify({ type: 'frame', image: b64 }))
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.7)
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [sendFrame])

  // ── Derived UI values ─────────────────────────────────────────────────────
  const fill        = result?.fill ?? 0
  const hasHand     = result?.has_hand ?? false
  const previewSign = result?.sign
  const previewConf = result?.confidence ?? 0

  const barColor = fill >= 1.0
    ? '#22c55e'                    // green — confirmed
    : fill >= 0.6
      ? '#f59e0b'                  // yellow — getting there
      : '#ef4444'                  // red — low confidence

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Camera feed */}
      <div style={{
        position: 'relative', background: '#000',
        borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3',
        boxShadow: confirmed ? `0 0 0 4px #22c55e` : '0 8px 32px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.3s',
      }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} width={320} height={240}
          style={{ display: 'none' }} />

        {/* No hand message */}
        {!hasHand && !cameraError && wsStatus === 'open' && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            padding: '8px 18px', borderRadius: 99, fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}>
            Hold your hand in front of the camera
          </div>
        )}

        {/* WS status */}
        {wsStatus !== 'open' && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: wsStatus === 'connecting' ? '#f59e0b' : '#ef4444',
            color: '#fff', padding: '4px 10px', borderRadius: 99,
            fontSize: '0.7rem', fontWeight: 700,
          }}>
            {wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(239,68,68,0.85)', color: '#fff',
            fontWeight: 700, fontSize: '1rem',
          }}>
            {cameraError}
          </div>
        )}

        {/* Confirmed banner */}
        {confirmed && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(34,197,94,0.88)', color: '#fff',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1 }}>
              {confirmed.odia}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 8, opacity: 0.9 }}>
              {confirmed.english}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.75 }}>
              Added to triage form ✓
            </div>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      <div style={{ background: '#f1f5f9', borderRadius: 16, padding: '1rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginBottom: 8, fontSize: '0.8rem', fontWeight: 700,
        }}>
          <span style={{ color: '#475569' }}>
            {previewSign
              ? `Detecting: ${previewSign} (${Math.round(previewConf * 100)}%)`
              : 'No sign detected'}
          </span>
          <span style={{ color: barColor }}>
            {Math.round(fill * 100)}%
          </span>
        </div>

        {/* Bar track */}
        <div style={{
          height: 14, background: '#e2e8f0',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${fill * 100}%`,
            background: barColor,
            borderRadius: 99,
            transition: 'width 0.1s ease, background 0.2s ease',
          }} />
        </div>

        {/* Hint text */}
        <div style={{
          marginTop: 8, fontSize: '0.72rem',
          color: fill < 0.4 && hasHand ? '#ef4444' : '#94a3b8',
          textAlign: 'center', minHeight: 18,
        }}>
          {!hasHand
            ? 'Show your hand to the camera'
            : fill < 0.4
              ? 'Show sign more clearly...'
              : fill < 1.0
                ? 'Hold steady...'
                : 'Confirmed!'}
        </div>
      </div>

      {/* All-confidences mini bars (preview of all 7 signs) */}
      {result?.all_confidences && hasHand && (
        <div style={{
          background: '#f8fafc', borderRadius: 16,
          padding: '0.75rem 1rem', border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
            ALL SIGNS
          </div>
          {Object.entries(result.all_confidences)
            .sort((a, b) => b[1] - a[1])
            .map(([sign, conf]) => (
              <div key={sign} style={{ marginBottom: 5 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.68rem', marginBottom: 2,
                }}>
                  <span style={{ color: sign === previewSign ? TEAL : '#64748b', fontWeight: sign === previewSign ? 700 : 400 }}>
                    {sign}
                  </span>
                  <span style={{ color: '#94a3b8' }}>{Math.round(conf * 100)}%</span>
                </div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${conf * 100}%`,
                    background: sign === previewSign ? TEAL : '#cbd5e1',
                    borderRadius: 99,
                    transition: 'width 0.1s ease',
                  }} />
                </div>
              </div>
            ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  )
}
