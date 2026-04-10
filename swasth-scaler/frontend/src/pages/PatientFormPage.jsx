/*
 * ============================================================
 *  SUPABASE TABLE SETUP SQL
 *  Run this in the Supabase SQL Editor before using the app:
 * ============================================================
 *
 * create table if not exists public.triage_records (
 *   id            uuid primary key default gen_random_uuid(),
 *   user_id       uuid references auth.users(id) on delete cascade,
 *   patient_name  text not null,
 *   age           integer not null,
 *   gender        text not null,
 *   district      text not null,
 *   symptom_text  text not null,
 *   severity      text not null,
 *   symptoms      text[] not null,
 *   sickle_cell_risk boolean not null default false,
 *   brief         text not null,
 *   created_at    timestamptz default now()
 * );
 *
 * -- Enable Row Level Security
 * alter table public.triage_records enable row level security;
 *
 * -- Policy: users can only read/write their own records
 * create policy "Users manage own records"
 *   on public.triage_records
 *   for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 *
 * ============================================================
 */

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePatient } from '../context/PatientContext.jsx'
import { useTriage } from '../hooks/useTriage'
import { translateToEnglish, openai } from '../lib/openai'
import DashboardLayout from '../components/DashboardLayout.jsx'
import SignLanguageModal from '../components/SignLanguageModal.jsx'

// ─── Duplicate-patient modal ──────────────────────────────────────────────────
const SEV_STYLE = {
  red:    { bg: 'var(--error-bg)', border: '#FCA5A5', text: '#C0392B' },
  yellow: { bg: '#FFFBEB', border: '#FCD34D', text: '#B7791F' },
  green:  { bg: 'var(--success-bg)', border: '#6EE7B7', text: '#1A6E5C' },
}

function DuplicateModal({ matches, onSelect, onNewPatient, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', fontFamily: "'Noto Sans Oriya', sans-serif" }}>
            ଏହି ରୋଗୀ ଆଗରୁ ଅଛନ୍ତି
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 2 }}>Patient already exists — select or add new</div>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {matches.map(p => {
            const last = p.triage_records?.[0]
            const sev = last?.severity
            const sc = SEV_STYLE[sev] || SEV_STYLE.green
            const lastDate = last
              ? new Date(last.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                style={{ width: '100%', padding: '0.875rem 1.25rem', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#374151', marginTop: 4, fontFamily: "'Noto Sans Oriya', sans-serif" }}>
                    ନାମ: {p.name} | वय: {p.age} | जिल्हा: {p.district}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.gender && `${p.gender} · `}{p.triage_records?.length || 0} visit{p.triage_records?.length !== 1 ? 's' : ''}
                  </div>
                  {lastDate && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>Last visit: {lastDate}</div>}
                </div>
                {sev && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text, flexShrink: 0 }}>
                    {sev.toUpperCase()}
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )
          })}
        </div>
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.625rem' }}>
          <button onClick={onClose}
            style={{ flex: 1, minHeight: 44, border: '1.5px solid #e5e7eb', background: 'var(--surface)', color: '#374151', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onNewPatient}
            style={{ flex: 1, minHeight: 44, border: 'none', background: '#0F6E56', color: 'var(--surface)', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Noto Sans Oriya', sans-serif" }}>
            ନା, ନୂଆ ରୋଗୀ / New
          </button>
        </div>
      </div>
    </div>
  )
}

const ALL_DISTRICTS = [
  "Ahilyanagar",
  "Akola",
  "Amravati",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Chhatrapati Sambhajinagar",
  "Dharashiv",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal"
]

const HIGH_RISK = new Set(["Gadchiroli","Chandrapur","Nagpur","Wardha","Bhandara","Gondia","Amravati","Yavatmal","Akola","Washim","Buldhana","Nandurbar","Dhule"])

export default function PatientFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill
  const prefillPatientId = location.state?.patientId || null

  const { setPatientData, setTriageResult } = usePatient()
  const { result, loading: triageLoading, error: triageError, runTriage } = useTriage()

  const [form, setForm] = useState({
    name: prefill?.name || '',
    age: prefill?.age || '',
    gender: prefill?.gender || '',
    district: prefill?.district || '',
    symptomText: prefill?.symptomText || '',
    latitude: null,
    longitude: null,
  })
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('or-IN')
  const [interimText, setInterimText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef(null)

  const [islModalOpen, setIslModalOpen] = useState(false)
  const [capturingLoc, setCapturingLoc] = useState(false)
  const [locSuccess, setLocSuccess] = useState(false)

  function captureLocation() {
    setCapturingLoc(true)
    setLocSuccess(false)
    setSaveError('')
    
    if (!navigator.geolocation) {
      setSaveError('Geolocation is not supported by your browser.')
      setCapturingLoc(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({ 
          ...prev, 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude 
        }))
        setLocSuccess(true)
        setCapturingLoc(false)
      },
      (err) => {
        setSaveError('Could not capture location. Please ensure GPS is on and permissions are granted.')
        setCapturingLoc(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Deduplication state
  const [duplicateMatches, setDuplicateMatches] = useState(null)
  const [resolvedPatientId, setResolvedPatientId] = useState(prefillPatientId)
  const pendingRef = useRef(null) // { patientObj, triaged }

  // Auto-lookup patient on form load when prefilled with name+age+district
  useEffect(() => {
    if (prefill?.name && prefill?.age && prefill?.district && !prefillPatientId) {
      const lookupPatient = async () => {
        try {
          const token = localStorage.getItem('access_token')
          const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/patients/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            const match = data.find(p => p.name.toLowerCase() === prefill.name.trim().toLowerCase() && p.age === parseInt(prefill.age) && p.district === prefill.district)
            if (match) {
              setResolvedPatientId(match.id)
            }
          }
        } catch (e) {
          console.error('Patient lookup failed', e)
        }
      }
      lookupPatient()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Precautions state
  const [precautionData, setPrecautionData] = useState(null)
  const [precautionLoading, setPrecautionLoading] = useState(false)

  async function fetchPrecautions(triaged, district) {
    setPrecautionLoading(true)
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a rural healthcare assistant for Odisha.
Given a triage result, provide exactly 3 short precautions in simple language that an ASHA worker can follow right now.
Each precaution must be under 10 words.
Return ONLY valid JSON: {"precautions":["precaution 1","precaution 2","precaution 3"],"priority":"immediate|within_hours|monitor_at_home"}`,
          },
          {
            role: 'user',
            content: `Severity: ${triaged.severity}\nSymptoms: ${(triaged.symptoms || []).join(', ')}\nDistrict: ${district}\nSickle cell risk: ${triaged.sickle_cell_risk}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      })
      const parsed = JSON.parse(resp.choices[0].message.content)
      setPrecautionData(parsed)
    } catch {
      setPrecautionData(null)
    } finally {
      setPrecautionLoading(false)
    }
  }

  const LANG_LABELS = {
    'or-IN': { speak: 'लक्षणे କୁହନ୍ତୁ', recording: 'ଶୁଣୁଛି… କହନ୍ତୁ', translating: 'ଅନୁବାଦ ହେଉଛି…' },
    'hi-IN': { speak: 'लक्षण बताएं', recording: 'सुन रहा हूँ… बोलिए', translating: 'अनुवाद हो रहा है…' },
    'en-IN': { speak: 'Speak symptoms', recording: 'Listening… speak now', translating: null },
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceError('Voice input not supported on this browser. Please type symptoms manually.')
      return
    }
    setVoiceError('')
    setInterimText('')
    const rec = new SR()
    rec.lang = voiceLang
    rec.continuous = false
    rec.interimResults = true
    rec.onstart = () => setListening(true)
    rec.onend = () => { setListening(false); setInterimText('') }
    rec.onerror = (e) => {
      setListening(false)
      setInterimText('')
      if (e.error === 'language-not-supported') {
        setVoiceError('Odia voice not supported in this browser. Try Chrome on Android.')
      } else if (e.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.')
      } else {
        setVoiceError('Voice not detected. Please try again.')
      }
    }
    rec.onresult = async (e) => {
      const results = Array.from(e.results)
      const interim = results.filter(r => !r.isFinal).map(r => r[0].transcript).join('')
      const final = results.filter(r => r.isFinal).map(r => r[0].transcript).join(' ')
      setInterimText(interim)
      if (final) {
        setInterimText('')
        if (voiceLang === 'or-IN' || voiceLang === 'hi-IN') {
          setTranslating(true)
          try {
            const english = await translateToEnglish(final)
            setForm(prev => ({ ...prev, symptomText: prev.symptomText ? prev.symptomText + ' ' + english : english }))
          } catch {
            setForm(prev => ({ ...prev, symptomText: prev.symptomText ? prev.symptomText + ' ' + final : final }))
          } finally {
            setTranslating(false)
          }
        } else {
          setForm(prev => ({ ...prev, symptomText: prev.symptomText ? prev.symptomText + ' ' + final : final }))
        }
      }
    }
    recognitionRef.current = rec
    rec.start()
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
    setInterimText('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  async function createNewPatient(patientObj) {
    const token = localStorage.getItem('access_token')
    const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/patients/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: patientObj.name,
        age: patientObj.age,
        gender: patientObj.gender,
        district: patientObj.district
      })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Could not create patient')
    }
    return await res.json()
  }

  async function saveRecord(patientId, patientObj, triaged) {
    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const payload = {
        patient_id:       patientId,
        patient_name:     patientObj.name,
        district:         patientObj.district,
        severity:         triaged.severity,
        symptoms:         triaged.symptoms,
        sickle_cell_risk: triaged.sickle_cell_risk,
        brief:            triaged.brief,
        latitude:         patientObj.latitude || null,
        longitude:        patientObj.longitude || null,
      }
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Could not save triage record')
      }
    } catch (err) {
      setSaveError('Record could not be saved: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setSaveError('')
    setShowResult(false)

    if (!form.name.trim() || !form.age || !form.gender || !form.district || !form.symptomText.trim()) {
      setSaveError('Please fill in all fields before analyzing.')
      return
    }

    const patientObj = {
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      gender: form.gender,
      district: form.district,
      symptomText: form.symptomText.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    }

    // STEP 1: Check for duplicates before triage (only when patient not already resolved)
    if (!resolvedPatientId) {
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/patients/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let existing = []
      if (res.ok) {
        const data = await res.json()
        existing = data.filter(p => p.name.toLowerCase() === form.name.trim().toLowerCase() && p.district === form.district && p.age === parseInt(form.age, 10)).slice(0, 5)
      }

      const matches = existing || []

      if (matches.length > 0) {
        // Sort each patient's triage records newest-first
        matches.forEach(p => {
          p.triage_records?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        })

        // Run triage in parallel while user picks from modal
        const triagedPromise = runTriage(form.symptomText, form.district)
        const triaged = await triagedPromise
        if (!triaged) return

        setPatientData(patientObj)
        setTriageResult(triaged)
        setShowResult(true)
        fetchPrecautions(triaged, form.district)

        // Store pending save; modal callbacks will finish it
        pendingRef.current = { patientObj, triaged }
        setDuplicateMatches(matches)
        return
      }
    }

    // No duplicate found (or patient already resolved) — run triage and save
    const triaged = await runTriage(form.symptomText, form.district)
    if (!triaged) return

    setPatientData(patientObj)
    setTriageResult(triaged)
    setShowResult(true)
    fetchPrecautions(triaged, form.district)

    let pid = resolvedPatientId
    if (!pid) {
      try {
        const np = await createNewPatient(patientObj)
        pid = np.id
        setResolvedPatientId(pid)
      } catch (err) {
        setSaveError('Could not create patient record: ' + (err.message || ''))
        return
      }
    }
    await saveRecord(pid, patientObj, triaged)
  }

  // Modal callbacks
  async function handleSelectExisting(patient) {
    setDuplicateMatches(null)
    const { patientObj, triaged } = pendingRef.current
    setResolvedPatientId(patient.id)
    await saveRecord(patient.id, patientObj, triaged)
  }

  async function handleForceNew() {
    setDuplicateMatches(null)
    const { patientObj, triaged } = pendingRef.current
    try {
      const np = await createNewPatient(patientObj)
      setResolvedPatientId(np.id)
      await saveRecord(np.id, patientObj, triaged)
    } catch (err) {
      setSaveError('Could not create patient record: ' + (err.message || ''))
    }
  }

  function handleGoToChat() {
    navigate('/chat')
  }

  return (
    <DashboardLayout contentStyle={{
      background: 'linear-gradient(-45deg, var(--island-grad-1), var(--island-grad-2), var(--island-grad-3), var(--island-grad-4))',
      backgroundSize: '400% 400%',
      animation: 'islandGradientShift 15s ease infinite',
    }}>
      <style>{`
        @keyframes islandGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {duplicateMatches && (
        <DuplicateModal
          matches={duplicateMatches}
          onSelect={handleSelectExisting}
          onNewPatient={handleForceNew}
          onClose={() => setDuplicateMatches(null)}
        />
      )}

      {/* Form Island */}
      <main style={{ 
        flex: 1, 
        padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem)', 
        maxWidth: 820, 
        width: '100%', 
        margin: 'clamp(0.5rem, 3vw, 2rem) auto',
        background: 'var(--island-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--island-border)'
      }}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Patient Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Patient Name
              <span className="odia-label">रुग्णाचे नाव</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Full name of patient"
              value={form.name}
              onChange={handleChange}
              autoCapitalize="words"
              autoComplete="name"
            />
          </div>

          {/* Age + Gender row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '0.875rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="age">
                Age
                <span className="odia-label">वय</span>
              </label>
              <input
                id="age"
                name="age"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                className="form-input"
                placeholder="Years"
                value={form.age}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gender">
                Gender
                <span className="odia-label">लिंग</span>
              </label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Male">Male / पुरुष</option>
                <option value="Female">Female / महिला</option>
                <option value="Other">Other / इतर</option>
              </select>
            </div>
          </div>

          {/* District */}
          <div className="form-group">
            <label className="form-label" htmlFor="district">
              District
              <span className="odia-label">जिल्हा</span>
            </label>
            <select
              id="district"
              name="district"
              className="form-select"
              value={form.district}
              onChange={handleChange}
            >
              <option value="">Select district</option>
              <optgroup label="High-Risk Districts / ଉଚ୍ଚ-ଝୁଁକି जिल्हा">
                {ALL_DISTRICTS.filter((d) => HIGH_RISK.has(d)).map((d) => (
                  <option key={d} value={d}>{d} ⚠</option>
                ))}
              </optgroup>
              <optgroup label="Other Districts / इतर जिल्हा">
                {ALL_DISTRICTS.filter((d) => !HIGH_RISK.has(d)).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            </select>
            {form.district && HIGH_RISK.has(form.district) && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-red)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                ⚠ High-risk district — sickle cell screening recommended
              </p>
            )}
          </div>

          {/* Visit History — only show when patient is positively identified (name+age+district matched) */}
          {resolvedPatientId && <VisitHistory name={form.name} patientId={resolvedPatientId} />}

          {/* Symptoms */}
          <div className="form-group">
            <label className="form-label" htmlFor="symptomText">
              Describe Symptoms
              <span className="odia-label">लक्षणे ବର୍ଣ୍ଣନା କରନ୍ତୁ</span>
            </label>
            <textarea
              id="symptomText"
              name="symptomText"
              className="form-textarea"
              placeholder="e.g. High fever for 3 days, joint pain, fatigue, loss of appetite…"
              value={form.symptomText}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {/* GPS Location Capture */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              GPS Location (Optional)
              <span className="odia-label">ଜିପିଏସ୍ ଅବସ୍ଥିତି (ଐଚ୍ଛିକ)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 12, border: '1px solid var(--island-border)' }}>
              <button
                type="button"
                onClick={captureLocation}
                disabled={capturingLoc}
                style={{
                  background: locSuccess ? '#10b981' : '#0F6E56',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: capturingLoc ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {capturingLoc ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    <span>Capturing...</span>
                  </>
                ) : locSuccess ? (
                  <>
                    <span>✓ Captured</span>
                  </>
                ) : (
                  <>
                    <span>📍 Capture Location</span>
                  </>
                )}
              </button>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {locSuccess 
                  ? `Coords: ${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)}` 
                  : 'Capture the exact location of the patient.'}
              </div>
            </div>
          </div>

          {/* Voice Input — Odia / Hindi / English */}
          <div
            style={{
              background: listening ? 'rgba(231,76,60,0.05)' : 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              border: `1.5px solid ${listening ? 'var(--color-red)' : 'var(--color-border)'}`,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {/* Language selector — always visible */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { code: 'or-IN', label: 'ଓଡ଼ିଆ' },
                { code: 'hi-IN', label: 'हिंदी' },
                { code: 'en-IN', label: 'English' },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => { if (!listening) setVoiceLang(code) }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 20,
                    border: '1.5px solid',
                    borderColor: voiceLang === code ? '#0F6E56' : 'var(--color-border)',
                    background: voiceLang === code ? '#0F6E56' : 'transparent',
                    color: voiceLang === code ? 'var(--surface)' : 'var(--color-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: listening ? 'default' : 'pointer',
                    opacity: listening && voiceLang !== code ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button
                type="button"
                onClick={listening ? stopVoice : startVoice}
                disabled={translating}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: listening ? '#e74c3c' : '#f39c12',
                  color: 'var(--surface)',
                  fontSize: '1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: translating ? 'default' : 'pointer',
                  flexShrink: 0,
                  boxShadow: listening
                    ? '0 0 0 6px rgba(231,76,60,0.2)'
                    : '0 2px 8px rgba(243,156,18,0.4)',
                  animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  opacity: translating ? 0.6 : 1,
                }}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              >
                {listening ? '⏹' : '🎤'}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: listening ? 'var(--color-red)' : 'var(--color-text)' }}>
                  {translating
                    ? (LANG_LABELS[voiceLang].translating || 'Translating…')
                    : listening
                      ? LANG_LABELS[voiceLang].recording
                      : LANG_LABELS[voiceLang].speak}
                </div>
                {interimText && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    {interimText}
                  </div>
                )}
                {!listening && !translating && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {voiceLang !== 'en-IN'
                      ? 'Auto-translated to English for triage'
                      : 'Click 🎤 to describe symptoms by voice'}
                  </div>
                )}
                {listening && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-red)', marginTop: 2 }}>
                    Click ⏹ to stop
                  </div>
                )}
              </div>
            </div>
          </div>
          {voiceError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠ {voiceError}</div>
          )}

          {/* ISL Mode button */}
          <button
            type="button"
            onClick={() => setIslModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: '1.5px solid #0F6E56',
              color: '#0F6E56',
              borderRadius: 10,
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1.25rem',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            🤟 ISL Mode — Use Hand Signs
            <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.8125rem' }}>/ ସାଙ୍କେତିକ ଭାଷା</span>
          </button>

          <SignLanguageModal 
            isOpen={islModalOpen} 
            onClose={() => setIslModalOpen(false)}
            onAddSymptom={(symptom) => {
              setForm(prev => ({
                ...prev,
                symptomText: prev.symptomText ? `${prev.symptomText}, ${symptom}` : symptom
              }))
            }}
          />

          {/* Errors */}
          {(triageError || saveError) && (
            <div className="alert alert-error" role="alert">
              <span aria-hidden="true">⚠</span>
              {triageError || saveError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={triageLoading || saving}
            style={{
              width: '100%', height: 56, fontSize: '1.125rem', fontWeight: 700,
              background: triageLoading || saving ? '#9ca3af' : '#0F6E56',
              color: 'var(--surface)', border: 'none', borderRadius: 12, cursor: triageLoading || saving ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
              transition: 'background 0.2s',
            }}
          >
            {triageLoading ? (
              <>
                <span className="spinner" style={{ width: 22, height: 22 }} />
                <span>ବିଶ୍ଳେଷଣ କରୁଛି… / Analyzing…</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>ବିଶ୍ଳେଷଣ କରନ୍ତୁ / Analyze</span>
              </>
            )}
          </button>
        </form>

        {/* Triage Result */}
        {showResult && result && (
          <div style={{ marginTop: '1.5rem' }}>
            <TriageResultCard
              result={result}
              precautionData={precautionData}
              precautionLoading={precautionLoading}
            />

            {/* Sickle cell warning */}
            {result.severity === 'red' && result.sickle_cell_risk && (
              <div style={{ marginTop: '1rem', background: '#FFF7ED', border: '2px solid #F97316', borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#C2410C', marginBottom: '0.375rem', fontFamily: "'Noto Sans Oriya', sans-serif" }}>
                  ⚠ ସତର୍କତା: ସିକଲ ସେଲ ଆଶଙ୍କା
                </div>
                <div style={{ fontSize: '0.875rem', color: '#9A3412', fontWeight: 600 }}>WARNING: Possible sickle cell crisis.</div>
                <div style={{ fontSize: '0.875rem', color: '#9A3412', marginTop: 4 }}>Do NOT give standard malaria medicine. Blood test required first.</div>
              </div>
            )}

            {saving && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="spinner spinner-dark" style={{ width: 16, height: 16 }} />
                Saving record…
              </p>
            )}

            {!saving && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleGoToChat}
                  style={{ minHeight: 48, padding: '0 1.25rem', background: '#0F6E56', color: 'var(--surface)', border: 'none', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  💬 AI ସହ ପଚାରନ୍ତୁ / Ask AI
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}

// ─── Precaution bullet emoji helper ──────────────────────────────────────────
function precautionEmoji(text) {
  const t = text.toLowerCase()
  if (/water|fluid|ors|drink/.test(t))                     return '💧'
  if (/rest|sleep|lie|lying/.test(t))                      return '🛏'
  if (/hospital|refer|phc|doctor|clinic/.test(t))          return '🏥'
  if (/medicine|tablet|dose|drug|paracetamol/.test(t))     return '💊'
  if (/food|eat|feed|nutrition|diet/.test(t))              return '🥗'
  if (/blood|test|sample|screen/.test(t))                  return '🩸'
  return '⚠'
}

// ─── Precaution Odia translations (approximate) ──────────────────────────────
const ODIA_MAP = {
  '💧': 'ପ୍ରଚୁର ପାଣି ଓ ORS ଦିଅନ୍ତୁ',
  '🛏': 'ରୋଗୀଙ୍କୁ ବିଶ୍ରାମ ଦିଅନ୍ତୁ',
  '🏥': 'ନିକଟ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ପଠାନ୍ତୁ',
  '💊': 'ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ଅନୁଯାୟୀ ଔଷଧ ଦିଅନ୍ତୁ',
  '🥗': 'ହାଲୁକା ଖାଦ୍ୟ ଦିଅନ୍ତୁ',
  '🩸': 'ରକ୍ତ ପରୀକ୍ଷା କରାନ୍ତୁ',
  '⚠': 'ସତର୍କ ରୁହନ୍ତୁ ଓ ନଜର ରଖନ୍ତୁ',
}

// ─── Expanded Triage Result Card with Precautions ────────────────────────────
function TriageResultCard({ result, precautionData, precautionLoading }) {
  const sev = result.severity?.toLowerCase()
  const cardBg    = sev === 'red' ? 'var(--error-bg)' : sev === 'yellow' ? '#FFFBEB' : '#F0FDF4'
  const cardBorder= sev === 'red' ? '#FCA5A5' : sev === 'yellow' ? '#FCD34D' : '#86EFAC'
  const sevColor  = sev === 'red' ? '#C0392B' : sev === 'yellow' ? '#B7791F' : '#166534'
  const sevIcon   = sev === 'red' ? '!' : sev === 'yellow' ? '⚠' : '✓'

  const priority = precautionData?.priority
  const priorityConfig = {
    immediate:       { bg: 'var(--error-bg)', border: '#FCA5A5', color: '#C0392B', label: '🚨 ତୁରନ୍ତ ଧ୍ୟାନ ଦରକାର / Immediate Attention' },
    within_hours:    { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', label: '⏰ ୨୪ ଘଣ୍ଟା ଭିତରେ / Within 24 Hours' },
    monitor_at_home: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: '🏠 ଘରେ ନଜର ରଖନ୍ତୁ / Monitor at Home' },
  }
  const pc = priorityConfig[priority] || null

  return (
    <div style={{ background: cardBg, border: `2px solid ${cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>

      {/* Priority badge */}
      {pc && (
        <div style={{ background: pc.bg, borderBottom: `1px solid ${pc.border}`, padding: '0.625rem 1rem', fontWeight: 700, fontSize: '0.875rem', color: pc.color, fontFamily: "'Noto Sans Oriya', sans-serif" }}>
          {pc.label}
        </div>
      )}

      {/* Severity header */}
      <div style={{ padding: '1rem 1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: sevColor, color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', flexShrink: 0 }}>
          {sevIcon}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: sevColor }}>{sev === 'red' ? 'Emergency' : sev === 'yellow' ? 'Moderate' : 'Stable'}</div>
          <div style={{ fontSize: '0.9375rem', color: sevColor, opacity: 0.8, fontFamily: "'Noto Sans Oriya', sans-serif" }}>
            {sev === 'red' ? 'ଜରୁରୀ' : sev === 'yellow' ? 'ମଧ୍ୟମ' : 'ସ୍ଥିର'}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1rem 1rem' }}>
        {/* Clinical summary */}
        {result.brief && (
          <div style={{ background: 'rgba(255,255,255,0.7)', borderLeft: `3px solid ${sevColor}`, borderRadius: 6, padding: '0.625rem 0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: sevColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Clinical Summary</div>
            <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>{result.brief}</div>
          </div>
        )}

        {/* Symptoms */}
        {result.symptoms?.length > 0 && (
          <div style={{ marginBottom: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: sevColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.375rem', fontFamily: "'Noto Sans Oriya', sans-serif" }}>
              Identified Symptoms / ଚିହ୍ନଟ लक्षणे
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {result.symptoms.map((s, i) => (
                <span key={i} style={{ fontSize: '0.8125rem', padding: '0.2rem 0.625rem', borderRadius: 20, border: `1px solid ${cardBorder}`, background: 'rgba(255,255,255,0.6)', color: sevColor }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Precautions section */}
        <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: '0.875rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: sevColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.625rem', fontFamily: "'Noto Sans Oriya', sans-serif" }}>
            ⚠ ସତର୍କତା / Precautions
          </div>
          {precautionLoading && (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #d1d5db', borderTopColor: sevColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading precautions…
            </div>
          )}
          {!precautionLoading && precautionData?.precautions?.map((p, i) => {
            const emoji = precautionEmoji(p)
            const odiaHint = ODIA_MAP[emoji]
            return (
              <div key={i} style={{ marginBottom: '0.625rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1.4 }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', lineHeight: 1.4 }}>{p}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1, fontFamily: "'Noto Sans Oriya', sans-serif" }}>{odiaHint}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function VisitHistory({ name, patientId }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!name || name.trim().length < 3) return
    setLoading(true)
    const token = localStorage.getItem('access_token')
    fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        let filtered = data
        if (patientId) {
          filtered = data.filter(r => r.patient_id === patientId)
        } else {
          filtered = data.filter(r => r.patient_name?.toLowerCase().includes(name.trim().toLowerCase()))
        }
        setRecords(filtered.slice(0, 3) || [])
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [name, patientId])

  if (loading) return <div style={{ padding: '0.75rem 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading history…</div>
  if (!records.length) return null

  const BADGE = { green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red' }

  return (
    <div style={{ marginBottom: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ padding: '0.625rem 0.875rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Visit History / ପୂର୍ବ ପରିଦର୍ଶନ
      </div>
      {records.map((r) => (
        <div key={r.id} style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${BADGE[r.severity] || 'badge-green'}`} style={{ flexShrink: 0 }}>{r.severity?.toUpperCase()}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.brief}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {r.district ? ` · ${r.district}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
