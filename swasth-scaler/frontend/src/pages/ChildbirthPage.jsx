import React, { useState, useRef, useEffect } from 'react'
import { openai } from '../lib/openai'
import ChatBubble from '../components/ChatBubble.jsx'
import Sidebar from '../components/Sidebar.jsx'

const SYSTEM_PROMPT = `You are a maternal health assistant for ASHA (Accredited Social Health Activist) workers in rural Odisha, India.

Your role is to guide ASHA workers through:
1. Pre-natal care advice (nutrition, danger signs, ANC visits)
2. Safe delivery practices and when to refer to a facility
3. Post-natal care for mother and newborn (first 48 hours, breastfeeding, cord care)
4. Danger signs that require IMMEDIATE referral to PHC or district hospital:
   - Heavy bleeding (more than a pad per hour)
   - Convulsions / fits
   - Baby not breathing at birth
   - High fever (>38.5°C) after delivery
   - Prolonged labour (>12 hours active phase)
   - Prolapsed cord
   - Baby birthweight <1.5 kg
5. IMNCI newborn protocols

Always respond in simple, practical language. Use both English and Odia words when helpful.
If there is a danger sign, respond with: 🔴 REFER IMMEDIATELY and explain why.
Otherwise give calm, step-by-step guidance.`

function buildGreeting() {
  return `Namaskar! I am your Childbirth & Maternal Health Assistant.

I can help you with:
- **Pre-natal care** — nutrition, ANC visits, danger signs
- **Safe delivery** — steps, when to refer
- **Post-natal care** — mother and newborn care, breastfeeding
- **Newborn emergencies** — resuscitation steps, danger signs

Ask me anything about maternal or newborn health.`
}

export default function ChildbirthPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: buildGreeting() }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Voice input not supported in this browser. Use Chrome.'); return }

    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); setError('Voice input failed. Try again.') }
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? prev + ' ' + transcript : transcript)
    }

    recognitionRef.current = rec
    rec.start()
  }

  function stopVoice() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError('')
    const userMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...updated.map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
        max_tokens: 600,
      })
      const content = response.choices[0]?.message?.content?.trim()
      if (!content) throw new Error('Empty response')
      setMessages(prev => [...prev, { role: 'assistant', content }])
    } catch (err) {
      setError(err.message || 'Failed to get response. Try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-bg)' }}>
      <Sidebar />

      {/* Header */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.875rem 1.5rem 0.875rem 4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        flexShrink: 0,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke='var(--surface)' strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>Childbirth Assistant</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
            ପ୍ରସବ ସହାୟକ · Maternal & Newborn Care
          </div>
        </div>

        {/* Quick reference chips */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Danger Signs', 'ANC Visits', 'Newborn Care', 'Breastfeeding'].map(topic => (
            <button
              key={topic}
              onClick={() => setInput(topic)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 20,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '0.8125rem',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text)' }}
            >
              {topic}
            </button>
          ))}
        </div>
      </header>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}
        role="log" aria-live="polite"
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
            borderRadius: '6px 12px 12px 12px',
            maxWidth: 200, boxShadow: 'var(--shadow)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <TypingDots />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Thinking…</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: '0.5rem', maxWidth: 500 }} role="alert">
            ⚠ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '1rem 2rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end',
        }}
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={listening ? stopVoice : startVoice}
          title={listening ? 'Stop recording' : 'Voice input'}
          style={{
            width: 46, height: 46, flexShrink: 0, borderRadius: 10, border: 'none',
            background: listening ? '#e74c3c' : '#f39c12',
            color: 'var(--surface)', fontSize: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: listening ? '0 0 0 4px rgba(231,76,60,0.25)' : '0 2px 8px rgba(243,156,18,0.4)',
            animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
            transition: 'background 0.2s',
          }}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        >
          {listening ? '⏹' : '🎤'}
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about maternal or newborn care… / ପ୍ରଶ୍ନ କରନ୍ତୁ…"
          disabled={loading}
          rows={1}
          style={{
            flex: 1, padding: '0.875rem 1.125rem',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.9375rem', lineHeight: 1.5,
            resize: 'none', background: 'var(--color-bg)',
            color: 'var(--color-text)', maxHeight: 140, overflowY: 'auto',
            fontFamily: 'inherit', transition: 'border-color var(--transition)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0.875rem 1.5rem', borderRadius: 'var(--radius)',
            background: loading || !input.trim() ? 'var(--color-border)' : 'var(--color-primary)',
            color: 'var(--surface)', fontWeight: 600, fontSize: '0.9375rem',
            border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'background var(--transition)',
          }}
        >
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (
            <>Send <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></>
          )}
        </button>
      </form>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--color-text-muted)', display: 'inline-block',
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  )
}
