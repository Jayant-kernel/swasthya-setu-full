import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { openai, getChatSystemPrompt } from '../lib/openai'
import { usePatient } from '../context/PatientContext.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import TopNav from '../components/TopNav.jsx'
import GlobalHeader from '../components/GlobalHeader.jsx'

const SEVERITY_BADGE = {
  green:  { label: 'Stable / स्थिर',       cls: 'badge-green' },
  yellow: { label: 'Moderate / मध्यम',        cls: 'badge-yellow' },
  red:    { label: 'Emergency / तातडीने',       cls: 'badge-red' },
}

const QUICK_REPLIES = [
  { marathi: 'औषध काय द्यावे?', english: 'What medicine should I give?' },
  { marathi: 'हे किती गंभीर आहे?',   english: 'How serious is this case?' },
  { marathi: 'डॉक्टरांकडे पाठवू का?', english: 'Should I refer to a doctor?' },
]

function buildGreeting(patient, triage) {
  const sickleNote = triage.sickle_cell_risk
    ? '\n\n🔴 सतर्कता: या रुग्णाला त्वरित जिल्हा रुग्णालयात पाठवा.'
    : ''

  const historyNote = (patient.history && patient.history.length > 1)
    ? `\n\nया रुग्णाकडे पूर्वीच्या **${patient.history.length}** भेटींचा इतिहास आहे.`
    : ''

  return `नमस्कार! मी तुमचा AI आरोग्य सहाय्यक आहे.
रुग्ण **${patient.name}** बद्दल तुमचे काय प्रश्न आहेत?

**ट्रायज निकाल: ${triage.severity.toUpperCase()}**
${triage.brief}

लक्षणे: ${triage.symptoms.join(', ')}${sickleNote}${historyNote}`
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { patientData, setPatientData, triageResult, setTriageResult } = usePatient()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Selector state
  const [availablePatients, setAvailablePatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all patients if none selected
  useEffect(() => {
    if (!patientData?.name || !triageResult) {
      fetchAvailablePatients()
    }
  }, [patientData, triageResult])

  async function fetchAvailablePatients() {
    setLoadingPatients(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch triage records')
      const recs = await res.json()
      
      const grouped = new Map()
      recs.forEach(r => {
        const key = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.district}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: r.patient_id || key,
            name: r.patient_name,
            age: r.age,
            gender: r.gender,
            district: r.district,
            records: []
          })
        }
        grouped.get(key).records.push(r)
      })
      const patients = Array.from(grouped.values()).map(p => ({
        ...p,
        latestSeverity: p.records[0]?.severity || 'green'
      }))
      
      setAvailablePatients(patients)
    } catch (err) {
      console.error('Fetch patients error:', err)
    } finally {
      setLoadingPatients(false)
    }
  }

  function handleSelectPatient(p) {
    const latest = p.records[0]
    setPatientData({
      name: p.name,
      age: p.age,
      gender: p.gender,
      district: p.district,
      symptomText: latest.symptom_text || '',
      history: p.records // Pass full history
    })
    setTriageResult({
      severity: latest.severity,
      brief: latest.brief,
      symptoms: latest.symptoms || [],
      sickle_cell_risk: latest.sickle_cell_risk
    })
  }

  // Pre-load greeting when patient is selected
  useEffect(() => {
    if (patientData?.name && triageResult) {
      setMessages([
        {
          role: 'assistant',
          content: buildGreeting(patientData, triageResult),
        },
      ])
    }
  }, [patientData, triageResult])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    setInput('')
    setError('')
    const userMessage = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)
    try {
      const systemPrompt = getChatSystemPrompt(patientData, triageResult)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...updatedMessages.map(m => ({ role: m.role, content: m.content }))],
        temperature: 0.4,
        max_tokens: 600,
      })
      const assistantContent = response.choices[0]?.message?.content?.trim()
      if (!assistantContent) throw new Error('Empty response from model.')
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError('')

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const systemPrompt = getChatSystemPrompt(patientData, triageResult)

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        // Include only user/assistant turns (not the greeting which can contain markdown)
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ]

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: apiMessages,
        temperature: 0.4,
        max_tokens: 600,
      })

      const assistantContent = response.choices[0]?.message?.content?.trim()
      if (!assistantContent) throw new Error('Empty response from model.')

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

   if (!patientData?.name || !triageResult) {
    const filtered = availablePatients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-bg)' }}>
        <GlobalHeader />
        <TopNav />
        <main style={{ flex: 1, padding: '2rem 1.25rem', maxWidth: 1000, width: '100%', margin: '0 auto', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.03em', marginBottom: '1rem' }}>AI चॅट: रुग्ण निवडा<br /><span style={{ fontSize: '1.25rem', opacity: 0.7 }}>AI Chat: Select a Patient</span></h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.125rem' }}>कोणाबद्दल बोलायचे आहे? / Who would you like to talk about?</p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto 3rem' }}>
            <input 
              type="text" 
              placeholder="रुग्णाचे नाव शोधा... / Search patient..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '1.25rem 3rem', borderRadius: 99, border: '2px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '1rem', outline: 'none', transition: 'all 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>

          {loadingPatients ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading patients...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filtered.map(p => {
                const sevColor = p.latestSeverity === 'red' ? 'var(--color-red)' : p.latestSeverity === 'yellow' ? 'var(--color-yellow)' : 'var(--color-green)'
                return (
                  <button 
                    key={p.id} 
                    onClick={() => handleSelectPatient(p)}
                    style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderLeft: `6px solid ${sevColor}`, borderRadius: 16, padding: '1.5rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{p.age} yrs · {p.gender} · {p.district}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 6, background: `${sevColor}15`, color: sevColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {p.latestSeverity}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                         {p.records.length} भेटी / {p.records.length} visits
                      </span>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                  रुग्ण आढळले नाहीत / No patients found.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    )
  }

  const badge = SEVERITY_BADGE[triageResult.severity?.toLowerCase()] || SEVERITY_BADGE.green

  const severityColor = { green: 'var(--color-green)', yellow: 'var(--color-yellow)', red: 'var(--color-red)' }[triageResult.severity] || 'var(--color-green)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-bg)' }}>
      {/* Top header bar */}
      <GlobalHeader>
        <div className="chat-patient-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.75rem', borderLeft: '2px solid #e5e7eb', marginLeft: '0.25rem', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{patientData.name}</span>
          <span className={`badge ${badge.cls} hide-mobile`} style={{ margin: 0, flexShrink: 0 }}>{badge.label}</span>
          {triageResult.sickle_cell_risk && (
            <div className="hide-mobile" style={{ background: 'var(--color-red)', color: 'var(--surface)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
              🔴 High Risk
            </div>
          )}
        </div>
      </GlobalHeader>
      <TopNav />

      {/* Mobile media queries + drawer */}
      <style>{`
        @media (max-width: 1100px) {
          .chat-sidebar { display: none !important; }
          .chat-messages-area { padding: 1.5rem !important; }
          .chat-input-area { padding: 0.75rem 1.5rem 1rem !important; }
          .chat-quick-replies { padding: 0.75rem 1.5rem 0 !important; }
          .chat-patient-header .badge { display: none; }
          .chat-info-btn { display: flex !important; }
        }
        .chat-info-btn { display: none; }
        .chat-drawer-backdrop {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          transition: opacity 0.25s ease;
        }
        .chat-drawer {
          position: fixed; inset: 0; z-index: 501;
          background: var(--color-bg);
          overflow-y: auto;
          padding: 0;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
      `}</style>

      {/* Main body: sidebar + chat */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — patient summary */}
        <aside className="chat-sidebar" style={{
          width: 280,
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '1.5rem 1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Patient Info</div>
            {[
              { label: 'Name', value: patientData.name },
              { label: 'Age', value: `${patientData.age} years` },
              { label: 'Gender', value: patientData.gender },
              { label: 'District', value: patientData.district },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '0.625rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Triage Result</div>
            <div style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius)',
              border: `2px solid ${severityColor}`,
              background: `${severityColor}12`,
              marginBottom: '0.875rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: severityColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {triageResult.severity}
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.375rem', color: 'var(--color-text)' }}>{triageResult.brief}</div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.375rem' }}>Symptoms</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {triageResult.symptoms?.map((s) => (
                <span key={s} style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.625rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text)',
                }}>{s}</span>
              ))}
            </div>
          </div>

          {triageResult.sickle_cell_risk && (
            <>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <div style={{
                background: 'var(--color-red-bg)',
                border: '1.5px solid var(--color-red-border)',
                borderRadius: 'var(--radius)',
                padding: '0.875rem',
                color: 'var(--color-red)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                🔴 High Sickle Cell Risk<br />
                <span style={{ fontWeight: 400, marginTop: '0.25rem', display: 'block' }}>Refer to district hospital immediately.</span>
              </div>
            </>
          )}
        </aside>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Mobile Patient Info button */}
          <button
            className="chat-info-btn"
            onClick={() => setShowMobileInfo(true)}
            style={{
              margin: '0.75rem 1rem 0',
              alignItems: 'center', gap: '0.5rem',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 99,
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Patient Info
            <span style={{ background: severityColor, color: '#fff', borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{triageResult.severity}</span>
          </button>
          {/* Messages */}
          <div
            className="chat-messages-area"
            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}
            role="log"
            aria-live="polite"
          >
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} />
            ))}

            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--color-white)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm) var(--radius) var(--radius) var(--radius-sm)',
                maxWidth: 200,
                boxShadow: 'var(--shadow)',
                animation: 'fadeIn 0.2s ease',
              }}>
                <TypingDots />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Thinking…</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '0.5rem', maxWidth: 500 }} role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply chips */}
          <div className="chat-quick-replies" style={{ padding: '0.5rem 2rem 0', background: 'var(--color-surface)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)' }}>
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip.marathi}
                type="button"
                onClick={() => sendMessage(chip.english)}
                disabled={loading}
                style={{ padding: '0.625rem 1.25rem', borderRadius: '999px', border: '1px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                {chip.marathi}
              </button>
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center', fontFamily: "'Noto Sans Devanagari', sans-serif" }} className="hide-mobile">मराठी किंवा इंग्रजीमध्ये लिहा</span>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="chat-input-area"
            style={{
              padding: '0.75rem 2rem 1rem',
              background: 'var(--color-surface)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… / प्रश्न विचारा…"
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                padding: '0.875rem 1.125rem',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                resize: 'none',
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                maxHeight: 140,
                overflowY: 'auto',
                fontFamily: 'inherit',
                transition: 'border-color var(--transition)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
              }}
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: 'var(--radius)',
                background: loading || !input.trim() ? 'var(--color-border)' : 'var(--color-primary)',
                color: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'background var(--transition)',
              }}
              aria-label="Send message"
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <>
                  Send
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Patient Info Full Screen Modal */}
      {showMobileInfo && (
        <>
          <div className="chat-drawer">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>Patient Info</div>
              <button 
                onClick={() => setShowMobileInfo(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9375rem' }}
              >
                Close ✕
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              {/* Switch Patient Button */}
              <button 
                onClick={() => {
                  setShowMobileInfo(false);
                  setPatientData({});
                  setTriageResult(null);
                }}
                style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l2 2M4 4l5 5"/></svg>
                Switch Patient
              </button>

              {/* Patient fields */}
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>Patient Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Name', value: patientData.name },
                  { label: 'Age', value: `${patientData.age} years` },
                  { label: 'Gender', value: patientData.gender },
                  { label: 'District', value: patientData.district },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Triage result */}
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>Triage Result</div>
              <div style={{ padding: '1.25rem', borderRadius: 14, border: `2px solid ${severityColor}`, background: `${severityColor}12`, marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: severityColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{triageResult.severity}</div>
                <div style={{ fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6, fontWeight: 500 }}>{triageResult.brief}</div>
              </div>

              {/* Symptoms */}
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>Symptoms</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: triageResult.sickle_cell_risk ? '1.5rem' : 0 }}>
                {triageResult.symptoms?.map(s => (
                  <span key={s} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{s}</span>
                ))}
              </div>

              {/* Sickle cell warning */}
              {triageResult.sickle_cell_risk && (
                <div style={{ background: 'var(--color-red-bg)', border: '1.5px solid var(--color-red-border)', borderRadius: 14, padding: '1.25rem', color: 'var(--color-red)', fontSize: '1rem', fontWeight: 700, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.25rem' }}>🔴</span> High Sickle Cell Risk
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--color-red)', opacity: 0.9 }}>Refer patient to district hospital immediately.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--color-text-muted)',
            display: 'inline-block',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
