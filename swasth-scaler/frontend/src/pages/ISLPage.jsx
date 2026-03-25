import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import TopNav from '../components/TopNav.jsx'
import GlobalHeader from '../components/GlobalHeader.jsx'

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

  const handsRef = useRef(null)
  const cameraRef = useRef(null)

  // ─── Client-side Model State ───
  const frameBuffer = useRef([])
  const isPredicting = useRef(false)

  // ─── Stabilization State ───
  const CONFIRM_FRAMES = 3
  const COOLDOWN_FRAMES = 10

  const currentStreakLabel = useRef(null)
  const currentStreakCount = useRef(0)
  const cooldownRemaining = useRef(0)
  const allDetections = useRef([])

  const extractLandmarks = useCallback((results) => {
    const landmarks = new Array(126).fill(0);
    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((hand, idx) => {
        if (idx >= 2) return;
        
        // The Python model was trained on mirrored webcam frames.
        // We MUST swap 'Right' and 'Left' to match the training data.
        let handedness = results.multiHandedness[idx].label;
        handedness = handedness === 'Right' ? 'Left' : 'Right';
        
        const offset = handedness === 'Right' ? 0 : 63;
        hand.forEach((lm, i) => {
          // We must also flip the X coordinate to emulate a mirrored camera
          landmarks[offset + i * 3] = 1.0 - lm.x;
          landmarks[offset + i * 3 + 1] = lm.y;
          landmarks[offset + i * 3 + 2] = lm.z;
        });
      });
    }
    return landmarks;
  }, []);

  const handleStabilization = useCallback((prediction, confidence) => {
    // 1. Process Cooldown
    if (cooldownRemaining.current > 0) {
      cooldownRemaining.current--
      if (cooldownRemaining.current === 0) {
        setActiveLabel(null)
        setActiveConfidence(0)
      }
      return
    }
    // 2. Ignore low confidence predictions
    if (confidence < 0.7) {
      currentStreakCount.current = 0
      currentStreakLabel.current = null
      return
    }
    // 3. Track consecutive matching predictions
    if (prediction === currentStreakLabel.current) {
      currentStreakCount.current++
    } else {
      currentStreakLabel.current = prediction
      currentStreakCount.current = 1
    }
    // 4. Lock in symptom if streak achieved
    if (currentStreakCount.current >= CONFIRM_FRAMES) {
      // PREVENT DUPLICATES in final list
      const alreadyExists = allDetections.current.some(d => d.label === prediction)
      if (!alreadyExists) {
        const newDetection = {
          label: prediction,
          confidence,
          index: allDetections.current.length + 1
        }
        allDetections.current = [...allDetections.current, newDetection]
        setDetections([...allDetections.current])
      }

      setActiveLabel(prediction)
      setActiveConfidence(confidence)

      // Trigger cooldown
      cooldownRemaining.current = COOLDOWN_FRAMES
      currentStreakCount.current = 0
      currentStreakLabel.current = null
    }
  }, [])

  function startCamera() {
    setCameraOn(true)
    setTimeout(() => {
      initMediaPipe()
    }, 50)
  }

  function stopCamera() {
    try { cameraRef.current?.stop() } catch { }
    try { handsRef.current?.close() } catch { }
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
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    })

    hands.onResults(async (results) => {
      // Push EVERY frame to our local buffer
      const landmarks = extractLandmarks(results)
      frameBuffer.current.push(landmarks)

      // Keep only the rolling window of the last 30 frames (1 second of time)
      if (frameBuffer.current.length > 30) {
        frameBuffer.current.shift()
      }

      // If buffer is full AND we aren't currently waiting for a network request
      if (frameBuffer.current.length === 30 && !isPredicting.current) {
        isPredicting.current = true

        try {
          // Send the full sequence batch at once - zero queuing delays
          const sequence = [...frameBuffer.current]
          const res = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence }),
          })
          const data = await res.json()

          if (data.prediction) {
            handleStabilization(data.prediction, data.confidence)
          }
        } catch (err) {
          console.error('API error:', err)
        } finally {
          isPredicting.current = false
        }
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
  }, [extractLandmarks, handleStabilization])

  const handleReset = () => {
    frameBuffer.current = []
    allDetections.current = []
    cooldownRemaining.current = 0
    currentStreakCount.current = 0
    setDetections([])
    setActiveLabel(null)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f7f9f8', display: 'flex', flexDirection: 'column' }}>
      <GlobalHeader />
      <TopNav />

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
                  <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                <div style={{ fontSize: '0.9rem' }}>Camera off</div>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem' }}>
            {!cameraOn ? (
              <button onClick={startCamera} disabled={!isConnected}
                style={{ width: '100%', padding: '0.875rem', background: isConnected ? TEAL : '#9ca3af', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: isConnected ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
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
