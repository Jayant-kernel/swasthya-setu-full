/**
 * ISLCamera.jsx
 * =============
 * Browser-side ISL detection using MediaPipe Hands (JS) + Random Forest (JSON).
 * No WebSocket or backend required — everything runs locally in the browser.
 *
 * Props:
 *   onSymptomDetected(symptomEnglish: string) — called on confirmation
 */

import { useEffect, useRef, useState } from 'react'

const CONFIRM_COOLDOWN_MS = 2000
const SMOOTHER_WINDOW     = 8
const SMOOTHER_THRESHOLD  = 5
const CONFIDENCE_THRESHOLD = 0.75
const TEAL = '#0F6E56'

const ODIA_LABELS = {
  fever:      'ଜ୍ୱର',
  cough:      'କାଶ',
  vomit:      'ବାନ୍ତି',
  weakness:   'ଦୁର୍ବଳତା',
  dizziness:  'ମୁଣ୍ଡ ବୁଲାଇବା',
  breathless: 'ନିଶ୍ୱାସ କଷ୍ଟ',
}

// Short 440Hz confirmation chime
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

// ── Random Forest inference (browser-side) ────────────────────────────────────
function predictRF(model, features) {
  const votes = new Array(model.n_classes).fill(0)

  for (const tree of model.trees) {
    let node = 0
    while (tree.children_left[node] !== -1) {
      if (features[tree.feature[node]] <= tree.threshold[node]) {
        node = tree.children_left[node]
      } else {
        node = tree.children_right[node]
      }
    }
    const val = tree.value[node][0]
    const total = val.reduce((a, b) => a + b, 0)
    for (let i = 0; i < model.n_classes; i++) {
      votes[i] += val[i] / total
    }
  }

  const total = votes.reduce((a, b) => a + b, 0)
  const probs = votes.map(v => v / total)
  const maxIdx = probs.indexOf(Math.max(...probs))

  const allConf = {}
  model.classes.forEach((cls, i) => { allConf[cls] = probs[i] })

  return { sign: model.classes[maxIdx], confidence: probs[maxIdx], allConf }
}

// ── Extract 42 features from MediaPipe landmarks ──────────────────────────────
function extractFeatures(landmarks) {
  // Normalize relative to wrist (landmark 0)
  const wrist = landmarks[0]
  const raw = landmarks.map(lm => [lm.x - wrist.x, lm.y - wrist.y])

  // Scale by wrist-to-middle-mcp distance
  const mid_mcp = raw[9]
  const scale = Math.sqrt(mid_mcp[0] ** 2 + mid_mcp[1] ** 2) || 1

  const features = []
  for (const [x, y] of raw) {
    features.push(x / scale, y / scale)
  }
  return features
}

// ── Temporal smoother ─────────────────────────────────────────────────────────
class TemporalSmoother {
  constructor(window = SMOOTHER_WINDOW, threshold = SMOOTHER_THRESHOLD) {
    this.window    = window
    this.threshold = threshold
    this.history   = []
    this.fill      = 0
  }

  update(sign) {
    this.history.push(sign)
    if (this.history.length > this.window) this.history.shift()

    const count = this.history.filter(s => s === sign).length
    this.fill = count / this.threshold
    return count >= this.threshold
  }

  reset() {
    this.history = []
    this.fill    = 0
  }
}

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const handsRef      = useRef(null)
  const modelRef      = useRef(null)
  const smootherRef   = useRef(new TemporalSmoother())
  const cooldownRef   = useRef(false)
  const animFrameRef  = useRef(null)

  const [status, setStatus]         = useState('loading') // loading|ready|error
  const [cameraError, setCameraError] = useState(null)
  const [result, setResult]         = useState(null)
  const [confirmed, setConfirmed]   = useState(null)
  const [hasHand, setHasHand]       = useState(false)

  // ── Load model JSON ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/isl_model.json')
      .then(r => r.json())
      .then(data => {
        modelRef.current = data
        setStatus('model_ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  // ── Load MediaPipe Hands + start camera when model ready ──────────────────
  useEffect(() => {
    if (status !== 'model_ready') return

    let stream = null
    let hands  = null

    async function init() {
      try {
        // Load MediaPipe Hands from CDN
        const mpHands = window.Hands
        if (!mpHands) {
          setStatus('error')
          setCameraError('MediaPipe not loaded. Please refresh.')
          return
        }

        hands = new mpHands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        hands.onResults((results) => {
          if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            setHasHand(false)
            smootherRef.current.reset()
            setResult(null)
            return
          }

          setHasHand(true)
          const landmarks = results.multiHandLandmarks[0]
          const features  = extractFeatures(landmarks)
          const model     = modelRef.current
          if (!model) return

          const { sign, confidence, allConf } = predictRF(model, features)

          if (confidence < CONFIDENCE_THRESHOLD) {
            setResult({ sign: null, confidence, allConf, fill: 0 })
            return
          }

          const confirmed_now = smootherRef.current.update(sign)
          const fill = Math.min(smootherRef.current.fill, 1)

          setResult({ sign, confidence, allConf, fill })

          if (confirmed_now && !cooldownRef.current) {
            cooldownRef.current = true
            playChime()
            const odia = ODIA_LABELS[sign] || sign
            setConfirmed({ english: sign, odia })
            onSymptomDetected?.(sign)
            smootherRef.current.reset()
            setTimeout(() => {
              setConfirmed(null)
              cooldownRef.current = false
            }, CONFIRM_COOLDOWN_MS)
          }
        })

        handsRef.current = hands

        // Start camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            setStatus('ready')
            startLoop()
          }
        }
      } catch (e) {
        setCameraError('Camera permission denied')
        setStatus('error')
      }
    }

    function startLoop() {
      async function loop() {
        const vid = videoRef.current
        if (vid && handsRef.current && vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0) {
          await handsRef.current.send({ image: vid })
        }
        animFrameRef.current = requestAnimationFrame(loop)
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    init()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      if (hands) hands.close()
    }
  }, [status, onSymptomDetected])

  // ── UI values ─────────────────────────────────────────────────────────────
  const fill        = result?.fill ?? 0
  const previewSign = result?.sign
  const previewConf = result?.confidence ?? 0

  const barColor = fill >= 1.0 ? '#22c55e' : fill >= 0.6 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Camera feed */}
      <div style={{
        position: 'relative', background: '#000',
        borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3',
        boxShadow: confirmed ? '0 0 0 4px #22c55e' : '0 8px 32px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.3s',
      }}>
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Loading overlay */}
        {(status === 'loading' || status === 'model_ready') && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', color: '#fff', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading ISL Model...</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Please wait</div>
          </div>
        )}

        {/* No hand message */}
        {status === 'ready' && !hasHand && !cameraError && (
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
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1 }}>
              {confirmed.odia}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 8, opacity: 0.9 }}>
              {confirmed.english}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.75 }}>
              Added to triage form
            </div>
          </div>
        )}

        {/* Ready indicator */}
        {status === 'ready' && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: '#22c55e', color: '#fff',
            padding: '4px 10px', borderRadius: 99,
            fontSize: '0.7rem', fontWeight: 700,
          }}>
            Live
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
          <span style={{ color: barColor }}>{Math.round(fill * 100)}%</span>
        </div>
        <div style={{ height: 14, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${fill * 100}%`,
            background: barColor, borderRadius: 99,
            transition: 'width 0.1s ease, background 0.2s ease',
          }} />
        </div>
        <div style={{
          marginTop: 8, fontSize: '0.72rem',
          color: fill < 0.4 && hasHand ? '#ef4444' : '#94a3b8',
          textAlign: 'center', minHeight: 18,
        }}>
          {!hasHand ? 'Show your hand to the camera'
            : fill < 0.4 ? 'Show sign more clearly...'
            : fill < 1.0 ? 'Hold steady...'
            : 'Confirmed!'}
        </div>
      </div>

      {/* All signs confidence bars */}
      {result?.allConf && hasHand && (
        <div style={{
          background: '#f8fafc', borderRadius: 16,
          padding: '0.75rem 1rem', border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
            ALL SIGNS
          </div>
          {Object.entries(result.allConf)
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
                    height: '100%', width: `${conf * 100}%`,
                    background: sign === previewSign ? TEAL : '#cbd5e1',
                    borderRadius: 99, transition: 'width 0.1s ease',
                  }} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
