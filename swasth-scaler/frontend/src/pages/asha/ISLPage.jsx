/**
 * ISLPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ISL Symptom Detection page — 10-sign ISL classifier.
 */

import { useState } from 'react'
import { useNavigate }       from 'react-router-dom'
import ISLCamera             from '../../components/asha/ISLCamera'

const TEAL       = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.12)'

const SIGNS_MAP = {
  'DARD': {
    label: 'Dard / ଯନ୍ତ୍ରଣା',
    icd10: 'R52',
    urgency: 'high',
    differentials: ['Acute injury', 'Chronic condition', 'Post-surgical pain', 'Referred pain'],
  },
  'BUKHAR': {
    label: 'Bukhar / ଜ୍ୱର',
    icd10: 'R50.9',
    urgency: 'high',
    differentials: ['Infection', 'Dengue', 'Malaria', 'Typhoid', 'COVID-19', 'Sepsis'],
  },
  'SAR-DARD': {
    label: 'Sar Dard / ମୁଣ୍ଡବିନ୍ଧା',
    icd10: 'R51',
    urgency: 'medium',
    differentials: ['Migraine', 'Hypertension', 'Meningitis', 'Tension headache', 'Sinusitis'],
  },
  'PET-DARD': {
    label: 'Pet Dard / ପେଟ ଯନ୍ତ୍ରଣା',
    icd10: 'R10.9',
    urgency: 'high',
    differentials: ['Appendicitis', 'Gastritis', 'IBS', 'Renal colic', 'Pancreatitis', 'Ectopic pregnancy'],
  },
  'ULTI': {
    label: 'Ulti / ବାନ୍ତି',
    icd10: 'R11.2',
    urgency: 'medium',
    differentials: ['GI infection', 'Pregnancy', 'Medication side-effect', 'Migraine', 'Meningitis'],
  },
  'KHANSI': {
    label: 'Khansi / କାଶ',
    icd10: 'R05.9',
    urgency: 'medium',
    differentials: ['Upper RTI', 'Pneumonia', 'TB', 'Asthma', 'COVID-19'],
  },
  'SANS-TAKLEEF': {
    label: 'Sans Takleef / ନିଶ୍ୱାସ କଷ୍ଟ',
    icd10: 'R06.00',
    urgency: 'critical',
    differentials: ['Asthma attack', 'Pulmonary embolism', 'Anaphylaxis', 'MI', 'COPD exacerbation'],
  },
  'SEENE-DARD': {
    label: 'Seene Dard / ଛାତି ଯନ୍ତ୍ରଣା',
    icd10: 'R07.9',
    urgency: 'critical',
    differentials: ['Myocardial infarction', 'Angina', 'Aortic dissection', 'Pulmonary embolism'],
  },
  'CHAKKAR': {
    label: 'Chakkar / ମୁଣ୍ଡ ବୁଲାଇବା',
    icd10: 'R42',
    urgency: 'medium',
    differentials: ['BPPV', 'Vertigo', 'Hypotension', 'TIA', 'Anaemia'],
  },
  'KAMZORI': {
    label: 'Kamzori / ଦୁର୍ବଳତା',
    icd10: 'R53.83',
    urgency: 'medium',
    differentials: ['Anaemia', 'Hypothyroidism', 'Diabetes', 'Depression', 'Chronic fatigue'],
  },
}

const URGENCY_STYLE = {
  critical: { bg: '#FCEBEB', color: '#A32D2D', label: 'CRITICAL' },
  high:     { bg: '#FAEEDA', color: '#854F0B', label: 'HIGH' },
  medium:   { bg: '#E6F1FB', color: '#185FA5', label: 'MEDIUM' },
  low:      { bg: '#EAF3DE', color: '#3B6D11', label: 'LOW' },
}

function SvgDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="82" width="60" height="58" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="33" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="50" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="67" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <circle cx="60" cy="110" r="10" fill="none" stroke="#A32D2D" strokeWidth="2"/>
      <path d="M 52 102 Q 60 98 68 102" fill="none" stroke="#A32D2D" strokeWidth="1.5"/>
    </svg>
  )
}
function SvgBukhar() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="12" y="100" width="22" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <ellipse cx="55" cy="25" rx="18" ry="10" fill="none" stroke="#854F0B" strokeWidth="1.5" strokeDasharray="3,2"/>
    </svg>
  )
}
function SvgSarDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="10" y="88" width="44" height="42" rx="8" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="66" y="88" width="44" height="42" rx="8" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="12" y="44" width="12" height="46" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="26" y="36" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="96" y="44" width="12" height="46" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="82" y="36" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 42 75 Q 60 68 78 75" fill="none" stroke="#185FA5" strokeWidth="1.8"/>
    </svg>
  )
}
function SvgPetDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="84" width="64" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="32" width="12" height="55" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="26" width="12" height="60" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="60" y="30" width="12" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="75" y="38" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <ellipse cx="60" cy="112" rx="18" ry="14" fill="none" stroke="#854F0B" strokeWidth="1.5" strokeDasharray="4,2"/>
    </svg>
  )
}
function SvgUlti() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="30" width="12" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="28" width="12" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="60" y="32" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="75" y="38" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 55 88 Q 40 100 30 120" fill="none" stroke="#854F0B" strokeWidth="2" markerEnd="url(#arr)"/>
    </svg>
  )
}
function SvgKhansi() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="92" width="64" height="46" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="38" width="14" height="56" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 35 92 L 35 110 L 60 110" fill="none" stroke="#185FA5" strokeWidth="2" strokeDasharray="3,2"/>
    </svg>
  )
}
function SvgSansTakleef() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="8"  y="80" width="44" height="60" rx="10" fill="#FDDCB5" stroke="#A32D2D" strokeWidth="2"/>
      <rect x="68" y="80" width="44" height="60" rx="10" fill="#FDDCB5" stroke="#A32D2D" strokeWidth="2"/>
      <rect x="10" y="30" width="12" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="25" y="22" width="12" height="60" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="98" y="30" width="12" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="83" y="22" width="12" height="60" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 52 100 Q 60 95 68 100" fill="none" stroke="#A32D2D" strokeWidth="2.5"/>
      <text x="50" y="148" fontSize="9" fill="#A32D2D" fontWeight="700">CRITICAL</text>
    </svg>
  )
}
function SvgSeeneDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#A32D2D" strokeWidth="2"/>
      <rect x="33" y="28" width="14" height="64" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="50" y="28" width="14" height="64" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="67" y="28" width="14" height="64" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 50 112 Q 60 118 70 112" fill="none" stroke="#A32D2D" strokeWidth="2.5"/>
      <text x="50" y="155" fontSize="9" fill="#A32D2D" fontWeight="700">CRITICAL</text>
    </svg>
  )
}
function SvgChakkar() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="52" y="30" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <circle cx="60" cy="55" r="20" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeDasharray="4,3"/>
      <path d="M 60 35 A 20 20 0 1 1 59 35" fill="none" stroke="#185FA5" strokeWidth="2" markerEnd="url(#arr2)"/>
    </svg>
  )
}
function SvgKamzori() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="8"  y="60" width="44" height="80" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="68" y="60" width="44" height="80" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="10" y="100" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="23" y="105" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="98" y="100" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="85" y="105" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <path d="M 30 60 L 30 80 M 90 60 L 90 80" stroke="#185FA5" strokeWidth="1.5" strokeDasharray="3,2"/>
    </svg>
  )
}

const SIGN_DIAGRAMS = {
  'DARD':         SvgDard,
  'BUKHAR':       SvgBukhar,
  'SAR-DARD':     SvgSarDard,
  'PET-DARD':     SvgPetDard,
  'ULTI':         SvgUlti,
  'KHANSI':       SvgKhansi,
  'SANS-TAKLEEF': SvgSansTakleef,
  'SEENE-DARD':   SvgSeeneDard,
  'CHAKKAR':      SvgChakkar,
  'KAMZORI':      SvgKamzori,
}

export default function ISLPage() {
  const navigate = useNavigate()
  const [detectedSymptoms, setDetectedSymptoms] = useState([])
  const [activeDetail, setActiveDetail] = useState(null)

  const handleSymptomDetected = (signId) => {
    const key  = signId.toUpperCase()
    const info = SIGNS_MAP[key]
    if (!info) return

    setDetectedSymptoms(prev => {
      if (prev.some(s => s.sign === key)) return prev
      return [{ sign: key, info, id: Date.now() }, ...prev]
    })

    if (info.urgency === 'critical') {
      setActiveDetail(key)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      <header style={{
        maxWidth: 1280,
        margin: '0 auto 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: TEAL, margin: 0 }}>
            ISL SYMPTOM DETECTOR
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.85rem' }}>
            10 signs · Indian Sign Language · MediaPipe + TF.js inference
          </p>
        </div>
        <button
          onClick={() => navigate('/patient')}
          style={{
            padding: '0.65rem 1.25rem',
            background: TEAL,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ← Back to Triage
        </button>
      </header>

      {detectedSymptoms.some(s => s.info.urgency === 'critical') && (
        <div style={{
          maxWidth: 1280, margin: '0 auto 1.25rem',
          background: '#FCEBEB', border: '2px solid #A32D2D',
          borderRadius: 12, padding: '0.85rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <div>
            <strong style={{ color: '#A32D2D', fontSize: '0.9rem' }}>CRITICAL SIGN DETECTED — Escalate immediately</strong>
            <div style={{ color: '#A32D2D', fontSize: '0.78rem', marginTop: 2 }}>
              {detectedSymptoms.filter(s => s.info.urgency === 'critical').map(s => s.sign).join(' + ')} detected.
              Refer patient urgently. Differential: {
                detectedSymptoms.filter(s => s.info.urgency === 'critical')
                  .flatMap(s => s.info.differentials.slice(0, 2))
                  .join(', ')
              }
            </div>
          </div>
        </div>
      )}

      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: '1.5rem',
      }}>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <ISLCamera onSymptomDetected={handleSymptomDetected} />

          <div>
            <h3 style={{
              fontSize: '0.75rem', fontWeight: 700,
              color: '#94a3b8', marginBottom: '0.75rem',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              SIGN REFERENCE — 10 ISL SYMPTOM SIGNS
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '0.65rem',
            }}>
              {Object.entries(SIGNS_MAP).map(([key, info]) => {
                const isDetected = detectedSymptoms.some(s => s.sign === key)
                const urgCfg = URGENCY_STYLE[info.urgency]
                const Diagram = SIGN_DIAGRAMS[key]
                return (
                  <div
                    key={key}
                    onClick={() => setActiveDetail(activeDetail === key ? null : key)}
                    style={{
                      background: '#fff',
                      padding: '0.65rem',
                      borderRadius: 14,
                      border: '1.5px solid',
                      borderColor: isDetected ? TEAL : info.urgency === 'critical' ? '#A32D2D55' : '#e2e8f0',
                      textAlign: 'center',
                      boxShadow: isDetected ? `0 0 0 3px ${TEAL}18` : 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.3s, box-shadow 0.3s',
                      position: 'relative',
                    }}
                  >
                    {isDetected && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        background: TEAL, color: '#fff',
                        borderRadius: '50%', width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 900,
                      }}>✓</div>
                    )}
                    <div style={{ height: 64, marginBottom: 4 }}>
                      {Diagram && <Diagram />}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: info.urgency === 'critical' ? '#A32D2D' : TEAL }}>
                      {key}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: 1 }}>
                      {info.label.split('/')[1]?.trim() || info.label}
                    </div>
                    <div style={{
                      marginTop: 4, display: 'inline-block',
                      fontSize: '0.55rem', padding: '1px 6px',
                      borderRadius: 8, background: urgCfg.bg, color: urgCfg.color,
                      fontWeight: 600,
                    }}>
                      {urgCfg.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {activeDetail && SIGNS_MAP[activeDetail] && (
              <div style={{
                marginTop: '0.75rem',
                background: '#fff',
                border: `1.5px solid ${URGENCY_STYLE[SIGNS_MAP[activeDetail].urgency].bg}`,
                borderRadius: 14,
                padding: '1rem 1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{activeDetail}</span>
                    <span style={{ marginLeft: 8, color: '#64748b', fontSize: '0.8rem' }}>
                      {SIGNS_MAP[activeDetail].label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', padding: '3px 10px', borderRadius: 8, fontWeight: 600,
                      background: URGENCY_STYLE[SIGNS_MAP[activeDetail].urgency].bg,
                      color: URGENCY_STYLE[SIGNS_MAP[activeDetail].urgency].color,
                    }}>
                      {URGENCY_STYLE[SIGNS_MAP[activeDetail].urgency].label}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      ICD-10: {SIGNS_MAP[activeDetail].icd10}
                    </span>
                    <button
                      onClick={() => setActiveDetail(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}
                    >×</button>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>
                  <strong style={{ color: '#374151' }}>Differentials to surface:</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SIGNS_MAP[activeDetail].differentials.map(d => (
                    <span key={d} style={{
                      fontSize: '0.7rem', padding: '2px 8px',
                      background: '#f1f5f9', borderRadius: 6, color: '#475569',
                    }}>{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div style={{
            background: '#fff',
            padding: '1.25rem',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            position: 'sticky',
            top: '1rem',
          }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
              SESSION CAPTURE
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {detectedSymptoms.map(s => {
                const urgCfg = URGENCY_STYLE[s.info.urgency]
                return (
                  <div key={s.id} style={{
                    padding: '0.85rem 1rem',
                    background: s.info.urgency === 'critical' ? '#FCEBEB' : TEAL_LIGHT,
                    borderRadius: 12,
                    border: `1px solid ${s.info.urgency === 'critical' ? '#A32D2D44' : `${TEAL}33`}`,
                    animation: 'slideIn 0.25s ease',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: s.info.urgency === 'critical' ? '#A32D2D' : TEAL, fontSize: '0.88rem' }}>
                            {s.sign}
                          </span>
                          <span style={{
                            fontSize: '0.6rem', padding: '1px 6px', borderRadius: 6,
                            background: urgCfg.bg, color: cfg.color, fontWeight: 700,
                          }}>
                            {urgCfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                          {s.info.label} · {s.info.icd10}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 3 }}>
                          {s.info.differentials.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/patient', {
                          state: { prefill: { symptomText: s.sign.toLowerCase().replace(/-/g, ' ') } },
                        })}
                        style={{
                          background: s.info.urgency === 'critical' ? '#A32D2D' : TEAL,
                          color: '#fff', border: 'none',
                          padding: '0.4rem 0.75rem', borderRadius: 7,
                          fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        USE
                      </button>
                    </div>
                  </div>
                )
              })}

              {detectedSymptoms.length === 0 && (
                <div style={{
                  textAlign: 'center', color: '#94a3b8',
                  padding: '2rem 0', fontSize: '0.82rem',
                  lineHeight: 1.6,
                }}>
                  Detected symptoms appear here.
                  <br />
                  <span style={{ fontSize: '0.72rem' }}>Hold a sign ~1 sec to trigger</span>
                </div>
              )}
            </div>

            {detectedSymptoms.length > 0 && (
              <button
                onClick={() => { setDetectedSymptoms([]); setActiveDetail(null) }}
                style={{
                  marginTop: '0.75rem', width: '100%', padding: '0.45rem',
                  background: 'transparent', border: '1px solid #e2e8f0',
                  borderRadius: 8, color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer',
                }}
              >
                Clear session
              </button>
            )}

            <div style={{
              marginTop: '1.25rem', padding: '0.85rem',
              background: '#f8fafc', borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em' }}>
                URGENCY LEGEND
              </div>
              {Object.entries(URGENCY_STYLE).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: '0.62rem', padding: '1px 7px', borderRadius: 6,
                    background: cfg.bg, color: cfg.color, fontWeight: 700, minWidth: 56, textAlign: 'center',
                  }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    {key === 'critical' ? 'Escalate on first detection' :
                     key === 'high'     ? 'Escalate at ≥70% confidence' :
                     key === 'medium'   ? 'Surface at next interaction' : 'Monitor at home'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '0.75rem', padding: '0.75rem',
              background: '#f0fdf4', borderRadius: 10,
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#166534', marginBottom: 3 }}>
                MODEL STATUS
              </div>
              <div style={{ fontSize: '0.65rem', color: '#166534', lineHeight: 1.5 }}>
                10-sign ISL model. Requires{' '}
                <code style={{ background: '#dcfce7', padding: '1px 4px', borderRadius: 3, fontSize: '0.6rem' }}>
                  /public/tfjs_model/model.json
                </code>
                {' '}active.
              </div>
            </div>
          </div>
        </aside>
      </main>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
