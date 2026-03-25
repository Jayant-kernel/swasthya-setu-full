import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

const TEAL = '#0F6E56'
const API_URL = 'http://localhost:5000'

export default function ISLPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const [detections, setDetections] = useState([])
  const [activeLabel, setActiveLabel] = useState(null)
  const [activeConfidence, setActiveConfidence] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const sessionId = useRef('session-' + Date.now())
  const handsRef = useRef(null)
  const cameraRef = useRef(null)

  const extractLandmarks = useCallback((results) => {
    const landmarks = new Array(126).fill(0)
    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((hand, idx) => {
        if (idx >= 2) return
        const handedness = results.multiHandedness[idx].label
        // Map Right hand to the first 63 floats, Left hand to the next 63
        const offset = handedness === 'Right' ? 0 : 63
        hand.forEach((lm, i) => {
          landmarks[offset + i * 3] = lm.x
          landmarks[offset + i * 3 + 1] = lm.y
          landmarks[offset + i * 3 + 2] = lm.z
        })
      })
    }
    return landmarks
  }, [])

  function startCamera() {
    setCameraOn(true)
    setTimeout(() => {
      initMediaPipe()
    }, 50)
  }

  function stopCamera() {
    try { cameraRef.current?.stop() } catch {}
    try { handsRef.current?.close() } catch {}
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraOn(false)
    setActiveLabel(null)
  }

  const initMediaPipe = () => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    })

    let frameCount = 0
    let isFetching = false

    hands.onResults(async (results) => {
      frameCount++
      if (frameCount % 3 !== 0) return

      if (isFetching) return
      isFetching = true

      const landmarks = extractLandmarks(results)

      try {
        const res = await fetch(`${API_URL}/predict_frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId.current,
            landmarks,
          }),
        })
        const data = await res.json()

        if (data.detection) {
          setDetections(data.all_detections || [])
        }
        setActiveLabel(data.active_label)
        setActiveConfidence(data.active_confidence || 0)
      } catch (err) {
        console.error('API Error:', err)
      } finally {
        isFetching = false
      }
    })

    handsRef.current = hands

    const video = videoRef.current
    if (video) {
      const camera = new Camera(video, {
        onFrame: async () => await hands.send({ image: video }),
        width: 640,
        height: 480,
      })
      camera.start()
      cameraRef.current = camera
    }
  }

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(() => setIsConnected(true))
      .catch(() => setIsConnected(false))

    const pingId = setInterval(() => {
      fetch(`${API_URL}/health`)
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false))
    }, 5000)

    return () => {
      clearInterval(pingId)
      stopCamera()
    }
  }, [extractLandmarks])

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId.current }),
      })
    } catch (e) {}
    setDetections([])
    setActiveLabel(null)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f7f9f8', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => { stopCamera(); navigate('/patient') }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: TEAL }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111' }}>ISL Sign Language / ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Powered by Machine Learning</div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.25rem', maxWidth: 760, width: '100%', margin: '0 auto' }}>

        <div style={{ background: isConnected ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: isConnected ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ height: 10, width: 10, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444' }}></span>
          {isConnected ? 'API Connected and ready.' : 'API not running. Please start the ML backend on port 5000.'}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ background: '#111', minHeight: cameraOn ? 'auto' : 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cameraOn ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
                  autoPlay
                  muted
                  playsInline
                />
                
                {activeLabel && (
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: activeConfidence > 0.75 ? '#1a472a' : '#4a3000', color: '#fff', borderRadius: 99, padding: '0.4rem 1.2rem', fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{activeLabel.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{(activeConfidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 8, opacity: 0.4 }}>
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <div style={{ fontSize: '0.9rem' }}>Camera off</div>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem' }}>
            {!cameraOn ? (
              <button onClick={startCamera}
                style={{ width: '100%', padding: '0.875rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Start Camera
              </button>
            ) : (
              <button onClick={stopCamera}
                style={{ width: '100%', padding: '0.75rem', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer' }}>
                Stop Camera
              </button>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.125rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111' }}>
              Detected Symptoms
            </div>
            {detections.length > 0 && (
              <button onClick={handleReset}
                style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer' }}>
                Reset Session
              </button>
            )}
          </div>

          {detections.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', padding: '1.5rem 0' }}>
              No symptoms detected yet — show a hand sign to the camera
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {detections.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 99, padding: '0.3rem 0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>
                    #{d.index}: {d.label.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#16a34a' }}>{(d.confidence * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
          
          {detections.length > 0 && (
            <button onClick={() => {
              const text = detections.map(d => d.label.replace('_', ' ')).join(', ')
              navigate('/patient', { state: { prefill: { symptomText: text } } })
            }}
              style={{ marginTop: '1rem', width: '100%', padding: '0.875rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Add to Patient Form →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
