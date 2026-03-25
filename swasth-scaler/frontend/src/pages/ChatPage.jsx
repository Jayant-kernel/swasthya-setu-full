import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openai, getChatSystemPrompt } from '../lib/openai'
import { usePatient } from '../context/PatientContext.jsx'
import ChatBubble from '../components/ChatBubble.jsx'
import Sidebar from '../components/Sidebar.jsx'

const SEVERITY_BADGE = {
  green:  { label: 'Safe / ସୁରକ୍ଷିତ',       cls: 'badge-green' },
  yellow: { label: 'Moderate / ମଧ୍ୟମ',        cls: 'badge-yellow' },
  red:    { label: 'Emergency / ଜରୁରୀ',       cls: 'badge-red' },
}

const QUICK_REPLIES = [
  { odia: 'କ\'ଣ ଔଷଧ ଦେବି?', english: 'What medicine should I give?' },
  { odia: 'କେତେ ଗୁରୁତର?',   english: 'How serious is this case?' },
  { odia: 'ଡାକ୍ତରଙ୍କ ପାଖକୁ ପଠାଇବି?', english: 'Should I refer to a doctor?' },
]

function buildGreeting(patient, triage) {
  const sickleNote = triage.sickle_cell_risk
    ? '\n\n🔴 ସତର୍କତା: ଏହି ରୋଗୀଙ୍କୁ ଜିଲ୍ଲା ଡାକ୍ତରଖାନାକୁ ତୁରନ୍ତ ପଠାନ୍ତୁ।'
    : ''

  return `ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ AI ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ।
ରୋଗୀ **${patient.name}** ବିଷୟରେ ଆପଣଙ୍କର ପ୍ରଶ୍ନ କ'ଣ?

**ତ୍ରିଆଜ ଫଳ: ${triage.severity.toUpperCase()}**
${triage.brief}

ଲକ୍ଷଣ: ${triage.symptoms.join(', ')}${sickleNote}`
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { patientData, triageResult } = usePatient()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // If no patient data, redirect back
  useEffect(() => {
    if (!patientData?.name || !triageResult) {
      navigate('/patient')
    }
  }, [patientData, triageResult, navigate])

  // Pre-load greeting
  useEffect(() => {
    if (patientData?.name && triageResult) {
      setMessages([
        {
          role: 'assistant',
          content: buildGreeting(patientData, triageResult),
        },
      ])
    }
  }, []) // Only on mount

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

  if (!patientData?.name || !triageResult) return null

  const badge = SEVERITY_BADGE[triageResult.severity?.toLowerCase()] || SEVERITY_BADGE.green

  const severityColor = { green: 'var(--color-green)', yellow: 'var(--color-yellow)', red: 'var(--color-red)' }[triageResult.severity] || 'var(--color-green)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-bg)' }}>
      <Sidebar />
      {/* Top header bar */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.875rem 1.5rem 0.875rem 4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0,
        boxShadow: 'var(--shadow)',
      }}>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{patientData.name}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              {patientData.age}y · {patientData.gender} · {patientData.district}
            </span>
          </div>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </div>

        {triageResult.sickle_cell_risk && (
          <div style={{ background: 'var(--color-red)', color: '#fff', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0 }}>
            🔴 Sickle Cell Risk
          </div>
        )}
      </header>

      {/* Main body: sidebar + chat */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — patient summary */}
        <aside style={{
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div
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
          <div style={{ padding: '0.5rem 2rem 0', background: 'var(--color-surface)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)' }}>
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip.odia}
                type="button"
                onClick={() => sendMessage(chip.english)}
                disabled={loading}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 99, border: '1.5px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: "'Noto Sans Oriya', sans-serif", whiteSpace: 'nowrap' }}
              >
                {chip.odia}
              </button>
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center', fontFamily: "'Noto Sans Oriya', sans-serif" }}>ଓଡ଼ିଆ ବା ଇଂରାଜୀରେ ଲେଖନ୍ତୁ</span>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
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
              placeholder="Ask a question… / ପ୍ରଶ୍ନ କରନ୍ତୁ…"
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
                color: '#fff',
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
