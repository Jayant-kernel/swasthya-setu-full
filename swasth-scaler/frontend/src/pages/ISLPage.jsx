import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ISLCamera from '../components/ISLCamera'

const TEAL       = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.12)'

// ─── Sign reference diagrams (kept for the reference grid) ───────────────────
function SvgFever()      { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="12" y="100" width="22" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgCough()      { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="92" width="64" height="46" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="30" y="38" width="14" height="56" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgPain()       { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="82" width="60" height="58" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="33" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="50" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="67" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgVomit()      { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="30" y="30" width="12" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="45" y="28" width="12" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="60" y="32" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="75" y="38" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgWeakness()   { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="40" y="60" width="50" height="80" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="42" y="100" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="55" y="105" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="68" y="103" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="80" y="108" width="8" height="35" rx="4" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgDizziness()  { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="52" y="30" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }
function SvgBreathless() { return <svg viewBox="0 0 120 160" width="100%" height="100%"><rect x="28" y="80" width="64" height="60" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="30" y="28" width="13" height="55" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="46" y="22" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="62" y="26" width="13" height="57" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/><rect x="78" y="34" width="10" height="50" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/></svg> }

const SIGNS_MAP = {
  'FEVER':      { odia: 'ଜ୍ୱର',      Diagram: SvgFever,      desc: 'Open palm facing outward' },
  'COUGH':      { odia: 'କାଶ',        Diagram: SvgCough,      desc: 'Fist on chest, thumb up' },
  'PAIN':       { odia: 'ଯନ୍ତ୍ରଣା',   Diagram: SvgPain,       desc: 'Fist pushed toward camera' },
  'VOMIT':      { odia: 'ବାନ୍ତି',     Diagram: SvgVomit,      desc: 'Fingers out from mouth' },
  'WEAKNESS':   { odia: 'ଦୁର୍ବଳତା',   Diagram: SvgWeakness,   desc: 'Wrist down, fingers limp' },
  'DIZZINESS':  { odia: 'ମୁଣ୍ଡ ବୁଲାଇ', Diagram: SvgDizziness,  desc: 'Index finger at forehead' },
  'BREATHLESS': { odia: 'ଶ୍ୱାସ କଷ୍ଟ',  Diagram: SvgBreathless, desc: 'Palm on chest, push out' },
}

export default function ISLPage() {
  const navigate = useNavigate()
  const [detectedSymptoms, setDetectedSymptoms] = useState([])

  const handleSymptomDetected = (englishName) => {
    const key  = englishName.toUpperCase()
    const info = SIGNS_MAP[key]
    if (!info) return
    // Avoid duplicates in this session
    setDetectedSymptoms(prev => {
      if (prev.some(s => s.sign === key)) return prev
      return [{ sign: key, odia: info.odia, id: Date.now() }, ...prev]
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>

      <header style={{ maxWidth: 1200, margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: TEAL, margin: 0 }}>ISL SYMPTOM DETECTOR</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Show a hand sign — system detects and adds to triage</p>
        </div>
        <button
          onClick={() => navigate('/patient')}
          style={{ padding: '0.75rem 1.5rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Back to Triage
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

        {/* Left — camera + sign grid */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ISLCamera component handles all detection */}
          <ISLCamera onSymptomDetected={handleSymptomDetected} />

          {/* Sign reference grid */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              SIGN REFERENCE
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {Object.entries(SIGNS_MAP).map(([key, info]) => (
                <div key={key} style={{
                  background: '#fff', padding: '0.75rem', borderRadius: 16,
                  border: `1px solid`,
                  borderColor: detectedSymptoms.some(s => s.sign === key) ? TEAL : '#e2e8f0',
                  textAlign: 'center',
                  boxShadow: detectedSymptoms.some(s => s.sign === key) ? `0 0 0 2px ${TEAL}22` : 'none',
                  transition: 'border-color 0.3s',
                }}>
                  <div style={{ height: 72, marginBottom: 6 }}>
                    {React.createElement(info.Diagram)}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: TEAL }}>{key}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 3 }}>{info.desc}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{info.odia}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right — session capture */}
        <aside>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 24, border: '1px solid #e2e8f0', position: 'sticky', top: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.25rem' }}>
              SESSION CAPTURE
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {detectedSymptoms.map(s => (
                <div key={s.id} style={{
                  padding: '1rem', background: TEAL_LIGHT,
                  borderRadius: 14, border: `1px solid ${TEAL}33`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 800, color: TEAL, fontSize: '0.9rem' }}>{s.sign}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{s.odia}</div>
                  </div>
                  <button
                    onClick={() => navigate('/patient', { state: { prefill: { symptomText: s.sign.toLowerCase() } } })}
                    style={{ background: TEAL, color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    USE
                  </button>
                </div>
              ))}

              {detectedSymptoms.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.85rem' }}>
                  Detected symptoms appear here
                </div>
              )}
            </div>

            {detectedSymptoms.length > 0 && (
              <button
                onClick={() => setDetectedSymptoms([])}
                style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 10, color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear session
              </button>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
