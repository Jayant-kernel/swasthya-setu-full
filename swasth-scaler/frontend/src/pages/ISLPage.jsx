import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const TEAL = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.12)'

// ─── SVG Hand Diagrams ────────────────────────────────────────────────────────

function SvgFever() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="12" y="100" width="22" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0,-6;0,0" dur="1.2s" repeatCount="indefinite"/><polygon points="54,6 48,18 60,18" fill={TEAL}/><line x1="54" y1="6" x2="54" y2="28" stroke={TEAL} strokeWidth="2.5"/></g></svg> }
function SvgCough() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><line x1="10" y1="88" x2="110" y2="88" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5 3"/><rect x="28" y="92" width="64" height="46" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0,6;0,0" dur="0.7s" repeatCount="indefinite"/><polygon points="54,52 48,63 60,63" fill={TEAL}/><line x1="54" y1="52" x2="54" y2="72" stroke={TEAL} strokeWidth="2.5"/></g></svg> }
function SvgPain() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="82" width="60" height="58" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="33" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="rotate" values="0 40 55;12 40 55;0 40 55;-12 40 55;0 40 55" dur="2s" repeatCount="indefinite"/><path d="M 56 18 A 18 18 0 0 1 72 30" stroke={TEAL} strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="72,30 78,20 64,22" fill={TEAL}/></g></svg> }
function SvgHeadache() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="84" width="60" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="31" y="28" width="14" height="60" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="48" y="22" width="14" height="66" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;-5,0;0,0" dur="1.2s" repeatCount="indefinite"/><polygon points="8,45 20,39 20,51" fill={TEAL}/><line x1="8" y1="45" x2="28" y2="45" stroke={TEAL} strokeWidth="2.5"/></g></svg> }
function SvgCold() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="32" y="90" width="56" height="50" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="74" y="42" width="10" height="50" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;10,0;0,0" dur="1s" repeatCount="indefinite"/><line x1="50" y1="20" x2="70" y2="20" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round"/></g></svg> }
function SvgSoreThroat() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="100" width="60" height="40" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="32" y="40" width="12" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="12" y="70" width="22" height="12" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0,8;0,0" dur="1.2s" repeatCount="indefinite"/><circle cx="60" cy="25" r="5" fill="#ef4444"/><circle cx="60" cy="25" r="10" stroke="#ef4444" fill="none" opacity="0.4"><animate attributeName="r" values="5;15" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0" dur="1.2s" repeatCount="indefinite"/></circle></g></svg> }
function SvgShiver() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><g><animateTransform attributeName="transform" type="translate" values="-2,0;2,0;-2,0" dur="0.1s" repeatCount="indefinite"/><rect x="35" y="85" width="50" height="55" rx="8" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="36" y="35" width="10" height="52" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="49" y="30" width="10" height="58" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="62" y="35" width="10" height="52" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></g></svg> }
function SvgNumbness() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="85" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><rect x="32" y="35" width="10" height="52" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"><animateTransform attributeName="transform" type="translate" values="0,0;0,4;0,0" dur="0.2s" repeatCount="indefinite"/></rect><rect x="46" y="30" width="10" height="58" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"><animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="0.25s" repeatCount="indefinite"/></rect><rect x="60" y="32" width="10" height="56" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"><animateTransform attributeName="transform" type="translate" values="0,0;0,3;0,0" dur="0.15s" repeatCount="indefinite"/></rect><rect x="74" y="40" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"><animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="0.22s" repeatCount="indefinite"/></rect></g></svg> }
function SvgBruise() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="85" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="8" y="95" width="24" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;8,0;0,0" dur="0.8s" repeatCount="indefinite"/><circle cx="60" cy="112" r="12" fill="#8b5cf6" opacity="0.6"/><path d="M 50 112 Q 60 122 70 112" stroke="#fff" fill="none" strokeWidth="1.5"/></g></svg> }
function SvgVomiting() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0,7;0,0" dur="1s" repeatCount="indefinite"/><polygon points="60,110 54,122 66,122" fill={TEAL}/><line x1="60" y1="108" x2="60" y2="130" stroke={TEAL} strokeWidth="2.5"/></g></svg> }
function SvgDiarrhea() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0,10;0,0" dur="0.9s" repeatCount="indefinite"/><polygon points="95,100 89,115 101,115" fill={TEAL}/><line x1="95" y1="98" x2="95" y2="122" stroke={TEAL} strokeWidth="2.5"/></g></svg> }

const SIGNS_MAP = {
  'FEVER': { odia: 'ଜ୍ୱର', Diagram: SvgFever, desc: 'Open palm up' },
  'COUGH': { odia: 'କାଶ', Diagram: SvgCough, desc: 'Fist taps chest' },
  'PAIN': { odia: 'ବ୍ୟଥା', Diagram: SvgPain, desc: 'Index only - twist' },
  'HEADACHE': { odia: 'ମୁଣ୍ଡ ବ୍ୟଥା', Diagram: SvgHeadache, desc: 'V sign to temple' },
  'COLD': { odia: 'ଥଣ୍ଡା', Diagram: SvgCold, desc: 'Pinky wipe nose' },
  'SORE THROAT': { odia: 'ଗଳା ବ୍ୟଥା', Diagram: SvgSoreThroat, desc: 'L-shape at neck' },
  'VOMITING': { odia: 'ବାନ୍ତି', Diagram: SvgVomiting, desc: 'Ring+pinky up - push' },
  'DIARRHEA': { odia: 'ତରଳ ଝାଡ଼ା', Diagram: SvgDiarrhea, desc: 'Middle+ring swipe down' },
  'SHIVER': { odia: 'ଥରିବା', Diagram: SvgShiver, desc: 'Shake hand fast' },
  'NUMBNESS': { odia: 'ଶୁଖିଯିବା', Diagram: SvgNumbness, desc: 'Wiggle all fingers' },
  'BRUISE': { odia: 'କ୍ଷତ', Diagram: SvgBruise, desc: 'Thumb out - rub' },
}

// ─── Detection Utilities ─────────────────────────────────────────────────────
function getDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

function getFingerStates(hand) {
  const wrist = hand[0]
  const isExtended = (tipIdx, baseIdx) => getDistance(hand[tipIdx], wrist) > getDistance(hand[baseIdx], wrist) * 1.15
  const isCurled = (tipIdx, baseIdx) => getDistance(hand[tipIdx], wrist) < getDistance(hand[baseIdx], wrist) * 1.0
  const thumbExtended = getDistance(hand[4], wrist) > getDistance(hand[2], wrist) * 1.2
  return {
    thumbExtended,
    indexUp: isExtended(8, 5), middleUp: isExtended(12, 9), ringUp: isExtended(16, 13), pinkyUp: isExtended(20, 17),
    indexCurled: isCurled(8, 5), middleCurled: isCurled(12, 9), ringCurled: isCurled(16, 13), pinkyCurled: isCurled(20, 17),
  }
}

const motionHistory = []

function detectSign(allHandLandmarks) {
  if (!allHandLandmarks || allHandLandmarks.length === 0) { motionHistory.length = 0; return null }
  const hand = allHandLandmarks[0]
  const f = getFingerStates(hand)
  const upCount = [f.indexUp, f.middleUp, f.ringUp, f.pinkyUp].filter(Boolean).length
  const curledCount = [f.indexCurled, f.middleCurled, f.ringCurled, f.pinkyCurled].filter(Boolean).length

  motionHistory.push({ hand, t: Date.now() })
  if (motionHistory.length > 20) motionHistory.shift()

  let jitter = 0
  if (motionHistory.length >= 5) {
      for(let i=1; i<motionHistory.length; i++) {
          jitter += getDistance(motionHistory[i].hand[8], motionHistory[i-1].hand[8])
      }
      jitter /= motionHistory.length
  }

  if (upCount >= 4 && jitter > 0.02) return { sign: 'NUMBNESS', odia: 'ଶୁଖିଯିବା' }
  if (jitter > 0.04) return { sign: 'SHIVER', odia: 'ଥରିବା' }

  if (curledCount >= 3 && upCount === 0 && motionHistory.length >= 10) {
      let revs = 0
      for(let i=2; i<10; i++) {
          const d1 = motionHistory[motionHistory.length-i+1].hand[0].y - motionHistory[motionHistory.length-i].hand[0].y
          const d2 = motionHistory[motionHistory.length-i].hand[0].y - motionHistory[motionHistory.length-i-1].hand[0].y
          if ((d1 > 0.008 && d2 < -0.008) || (d1 < -0.008 && d2 > 0.008)) revs++
      }
      if (revs >= 2) return { sign: 'COUGH', odia: 'କାଶ' }
  }

  if (f.pinkyUp && upCount === 1 && jitter > 0.015) return { sign: 'COLD', odia: 'ଥଣ୍ଡା' }
  if (f.indexUp && f.thumbExtended && upCount === 1 && hand[0].y < 0.45) return { sign: 'SORE THROAT', odia: 'ଗଳା ବ୍ୟଥା' }
  if (f.thumbExtended && curledCount >= 3 && jitter > 0.01) return { sign: 'BRUISE', odia: 'କ୍ଷତ' }

  if (upCount === 4) return { sign: 'FEVER', odia: 'ଜ୍ୱର' }
  if (upCount === 2 && f.indexUp && f.middleUp) return { sign: 'HEADACHE', odia: 'ମୁଣ୍ଡ ବ୍ୟଥା' }
  if (upCount === 2 && !f.indexUp && f.middleUp && f.ringUp) return { sign: 'DIARRHEA', odia: 'ତରଳ ଝାଡ଼ା' }
  if (upCount === 2 && !f.indexUp && !f.middleUp && f.ringUp && f.pinkyUp) return { sign: 'VOMITING', odia: 'ବାନ୍ତି' }
  if (upCount === 1 && f.indexUp) return { sign: 'PAIN', odia: 'ବ୍ୟଥା' }
  
  return null
}

export default function ISLPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const frameBuffer = useRef([])
  const flashTimeout = useRef(null)

  const [loading, setLoading] = useState(false)
  const [currentSign, setCurrentSign] = useState(null)
  const [frameProgress, setFrameProgress] = useState(0)
  const [detectedSymptoms, setDetectedSymptoms] = useState([])
  const [error, setError] = useState('')

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res()
      const s = document.createElement('script')
      s.src = src; s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks?.length > 0) {
      if (window.drawConnectors) {
        window.drawConnectors(ctx, results.multiHandLandmarks[0], window.HAND_CONNECTIONS, { color: '#0F6E56', lineWidth: 4 })
        window.drawLandmarks(ctx, results.multiHandLandmarks[0], { color: '#FDDCB5', lineWidth: 2, radius: 4 })
      }
      const res = detectSign(results.multiHandLandmarks)
      setCurrentSign(res)
      frameBuffer.current.push(res?.sign || null)
      if (frameBuffer.current.length > 7) frameBuffer.current.shift()
      const sameCount = frameBuffer.current.filter(s => res && s === res.sign).length
      setFrameProgress(sameCount)
      if (sameCount === 7 && res) {
        if (!detectedSymptoms.some(s => s.sign === res.sign)) {
          setDetectedSymptoms(prev => [{ ...res, id: Date.now() }, ...prev])
        }
        frameBuffer.current = []
      }
    } else {
      frameBuffer.current = []; setCurrentSign(null); setFrameProgress(0)
    }
    ctx.restore()
  }, [detectedSymptoms])

  useEffect(() => {
    const start = async () => {
      setLoading(true)
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        const hands = new window.Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` })
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
        hands.onResults(onResults)
        handsRef.current = hands
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => { if (videoRef.current) await hands.send({ image: videoRef.current }) },
          width: 640, height: 480
        })
        camera.start()
        cameraRef.current = camera
      } catch (err) { setError('Camera permission denied') }
      setLoading(false)
    }
    start()
    return () => { cameraRef.current?.stop(); handsRef.current?.close() }
  }, [onResults])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: TEAL, margin: 0 }}>ISL SYMPTOM TRAINER</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Learn and test Indian Sign Language medical signs</p>
        </div>
        <button onClick={() => navigate('/patient')} style={{ padding: '0.75rem 1.5rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Back to Triage</button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <section>
          <div style={{ position: 'relative', background: '#000', borderRadius: 24, overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} playsInline />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
            
            {currentSign && (
              <div style={{ position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,110,86,0.9)', backdropFilter: 'blur(10px)', color: '#fff', padding: '12px 24px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 15 }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{currentSign.sign}</span>
                <div style={{ width: 100, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(frameProgress/7)*100}%`, background: '#fff', transition: 'width 0.1s' }} />
                </div>
              </div>
            )}
            {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>Initializing AI...</div>}
            {error && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.8)', color: '#fff', fontWeight: 700 }}>{error}</div>}
          </div>

          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {Object.entries(SIGNS_MAP).map(([key, info]) => (
                <div key={key} style={{ background: '#fff', padding: '1rem', borderRadius: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ height: 80, marginBottom: 8 }}>{React.createElement(info.Diagram)}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: TEAL }}>{key}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>{info.desc}</div>
                </div>
            ))}
          </div>
        </section>

        <aside>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 24, border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem' }}>SESSION CAPTURE</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {detectedSymptoms.map(s => (
                <div key={s.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: TEAL }}>{s.sign}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.odia}</div>
                  </div>
                  <button onClick={() => navigate('/patient', { state: { prefill: { symptomText: s.sign } } })} style={{ background: TEAL, color: '#fff', border: 'none', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>USE</button>
                </div>
              ))}
              {detectedSymptoms.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>No signs detected yet</div>}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
