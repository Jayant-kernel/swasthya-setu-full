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

const CONFIRM_COOLDOWN_MS  = 2000
const SMOOTHER_WINDOW      = 8
const SMOOTHER_THRESHOLD   = 5
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

function predictRF(model, features) {
  const votes = new Array(model.n_classes).fill(0)
  for (const tree of model.trees) {
    let node = 0
    while (tree.children_left[node] !== -1) {
      if (features[tree.feature[node]] <= tree.threshold[node])
        node = tree.children_left[node]
      else
        node = tree.children_right[node]
    }
    const val   = tree.value[node][0]
    const total = val.reduce((a, b) => a + b, 0)
    for (let i = 0; i < model.n_classes; i++) votes[i] += val[i] / total
  }
  const sum   = votes.reduce((a, b) => a + b, 0)
  const probs = votes.map(v => v / sum)
  const maxIdx = probs.indexOf(Math.max(...probs))
  const allConf = {}
  model.classes.forEach((cls, i) => { allConf[cls] = probs[i] })
  return { sign: model.classes[maxIdx], confidence: probs[maxIdx], allConf }
}

function extractFeatures(landmarks) {
  // Must match Python normalize_landmarks() in collect_static.py exactly:
  //   coords -= coords[0]          (subtract wrist)
  //   scale = np.linalg.norm(coords[12])  (landmark 12 = middle fingertip)
  const wrist = landmarks[0]
  const raw   = landmarks.map(lm => [lm.x - wrist.x, lm.y - wrist.y])
  const tip12 = raw[12]  // middle finger TIP (not MCP)
  const scale = Math.sqrt(tip12[0] ** 2 + tip12[1] ** 2) || 1
  const feats = []
  for (const [x, y] of raw) feats.push(x / scale, y / scale)
  return feats
}

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
  reset() { this.history = []; this.fill = 0 }
}

export default function ISLCamera({ onSymptomDetected }) {
  const videoRef     = useRef(null)
  const handsRef     = useRef(null)
  const modelRef     = useRef(null)
  const smootherRef  = useRef(new TemporalSmoother())
  const cooldownRef  = useRef(false)
  const animFrameRef = useRef(null)
  const activeRef    = useRef(true)   // tracks if component is still mounted

  const [phase, setPhase]           = useState('init')   // init|cam|running|error
  const [cameraError, setCameraError] = useState(null)
  const [result, setResult]         = useState(null)
  const [confirmed, setConfirmed]   = useState(null)
  const [hasHand, setHasHand]       = useState(false)

  const onSymptomRef = useRef(onSymptomDetected)
  useEffect(() => { onSymptomRef.current = onSymptomDetected }, [onSymptomDetected])

  useEffect(() => {
    activeRef.current = true
    let stream = null

    async function start() {
      // 1. Load model
      let model
      try {
        const r = await fetch('/isl_model.json')
        model = await r.json()
        modelRef.current = model
      } catch {
        if (activeRef.current) { setCameraError('Failed to load model'); setPhase('error') }
        return
      }
      if (!activeRef.current) return

      // 2. Check MediaPipe
      if (!window.Hands) {
        if (activeRef.current) { setCameraError('MediaPipe not loaded — refresh'); setPhase('error') }
        return
      }

      // 3. Start camera FIRST — get stream before initialising MediaPipe
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
      } catch {
        if (activeRef.current) { setCameraError('Camera access denied'); setPhase('error') }
        return
      }
      if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return }

      // 4. Attach stream to video element
      const vid = videoRef.current
      if (!vid) return
      vid.srcObject = stream
      setPhase('cam')   // show camera (video element is now live)

      // 5. Wait for video to actually have frames
      await new Promise(resolve => {
        if (vid.readyState >= 2) { resolve(); return }
        vid.addEventListener('canplay', resolve, { once: true })
      })
      if (!activeRef.current) return

      try { await vid.play() } catch (_) {}
      if (!activeRef.current) return

      // 6. Extra settle time so first frame has real pixels
      await new Promise(r => setTimeout(r, 500))
      if (!activeRef.current) return

      // 7. Init MediaPipe Hands
      const hands = new window.Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
      })
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      hands.onResults(results => {
        if (!activeRef.current) return
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          setHasHand(false)
          smootherRef.current.reset()
          setResult(null)
          return
        }
        setHasHand(true)
        const landmarks = results.multiHandLandmarks[0]
        const features  = extractFeatures(landmarks)
        const { sign, confidence, allConf } = predictRF(modelRef.current, features)

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
          onSymptomRef.current?.(sign)
          smootherRef.current.reset()
          setTimeout(() => {
            if (activeRef.current) { setConfirmed(null); cooldownRef.current = false }
          }, CONFIRM_COOLDOWN_MS)
        }
      })
      handsRef.current = hands
      setPhase('running')

      // 8. Frame loop
      async function loop() {
        if (!activeRef.current) return
        const v = videoRef.current
        if (v && handsRef.current && v.videoWidth > 0 && v.videoHeight > 0 && !v.paused) {
          try { await handsRef.current.send({ image: v }) } catch (_) {}
        }
        animFrameRef.current = requestAnimationFrame(loop)
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    start()

    return () => {
      activeRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      if (handsRef.current) { handsRef.current.close(); handsRef.current = null }
    }
  }, [])   // ← runs ONCE, no status in deps

  const fill        = result?.fill ?? 0
  const previewSign = result?.sign
  const previewConf = result?.confidence ?? 0
  const barColor    = fill >= 1.0 ? '#22c55e' : fill >= 0.6 ? '#f59e0b' : '#ef4444'
  const isLoading   = phase === 'init'
  const isLive      = phase === 'running'

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

        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', color: '#fff', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading ISL Model...</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Please wait</div>
          </div>
        )}

        {/* No hand message */}
        {isLive && !hasHand && !cameraError && (
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
            fontWeight: 700, fontSize: '1rem', padding: '1rem', textAlign: 'center',
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

        {/* Live badge */}
        {isLive && (
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
