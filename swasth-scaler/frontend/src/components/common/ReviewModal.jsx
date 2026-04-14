import React, { useState } from 'react'

const STARS = [1, 2, 3, 4, 5]

const CATEGORIES = [
  { id: 'ease', label: 'Ease of Use', emoji: '🖥️' },
  { id: 'data',  label: 'Data Accuracy', emoji: '📊' },
  { id: 'speed', label: 'Speed', emoji: '⚡' },
  { id: 'design', label: 'Design', emoji: '🎨' },
]

function StarRating({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {STARS.map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            fontSize: size, lineHeight: 1,
            color: s <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.12s, transform 0.12s',
            transform: s <= (hover || value) ? 'scale(1.18)' : 'scale(1)',
          }}
        >★</button>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   ReviewModal  –  fires on logout
────────────────────────────────────────────────────────── */
export function ReviewModal({ role, onSkip, onSubmit }) {
  const [overall, setOverall] = useState(0)
  const [cats, setCats] = useState({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const roleName = role === 'dmo' ? 'DMO Command Dashboard' : 'ASHA Worker Dashboard'

  function handleSubmit(e) {
    e.preventDefault()
    const review = { role, overall, categories: cats, comment, timestamp: new Date().toISOString() }
    // Persist locally
    const prev = JSON.parse(localStorage.getItem('swasthya_reviews') || '[]')
    localStorage.setItem('swasthya_reviews', JSON.stringify([...prev, review]))
    setSubmitted(true)
    setTimeout(onSubmit, 1800)
  }

  return (
    <>
      <style>{`
        @keyframes rm-in { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        .rm-textarea { resize: vertical; font-family: inherit; }
        .rm-textarea:focus { outline: none; border-color: #0F6E56; box-shadow: 0 0 0 3px rgba(15,110,86,0.12); }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          background: '#fff', borderRadius: '1.5rem',
          padding: '2.5rem 2rem', maxWidth: 460, width: '100%',
          boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
          animation: 'rm-in 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
        }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🙏</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
                Thank you!
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Your feedback helps us improve Swasthya Setu for every ASHA worker and officer.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '0.625rem' }}>⭐</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
                  How was your experience?
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                  Rate the <strong>{roleName}</strong> before you leave
                </p>
              </div>

              {/* Overall */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Rating</span>
                <StarRating value={overall} onChange={setOverall} size={30} />
              </div>

              {/* Category ratings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} style={{
                    background: '#f9fafb', borderRadius: 12,
                    padding: '0.75rem 0.875rem',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </div>
                    <StarRating value={cats[cat.id] || 0} onChange={v => setCats(p => ({ ...p, [cat.id]: v }))} size={16} />
                  </div>
                ))}
              </div>

              {/* Comment */}
              <textarea
                className="rm-textarea"
                placeholder="Any suggestions or comments? (optional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.75rem 1rem', borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  fontSize: '0.875rem', color: '#111827',
                  background: '#f9fafb',
                  marginBottom: '1.25rem',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  fontFamily: 'inherit',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onSkip}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', background: '#f9fafb',
                    color: '#6b7280', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={overall === 0}
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: 12,
                    border: 'none', background: overall === 0 ? '#d1d5db' : '#0F6E56',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    cursor: overall === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { if (overall > 0) e.currentTarget.style.background = '#0a5240' }}
                  onMouseLeave={e => { if (overall > 0) e.currentTarget.style.background = '#0F6E56' }}
                >
                  Submit Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────
   ReviewSection  –  always visible at bottom of dashboard
────────────────────────────────────────────────────────── */
export function ReviewSection({ role, isDark }) {
  const [overall, setOverall] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const bg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const bdr = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const textColor = isDark ? '#e2e8f0' : '#111827'
  const muteColor = isDark ? '#94a3b8' : '#6b7280'
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'
  const inputBdr = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'

  function handleSubmit(e) {
    e.preventDefault()
    if (overall === 0) return
    const review = { role, overall, comment, timestamp: new Date().toISOString(), source: 'inline' }
    const prev = JSON.parse(localStorage.getItem('swasthya_reviews') || '[]')
    localStorage.setItem('swasthya_reviews', JSON.stringify([...prev, review]))
    setSubmitted(true)
  }

  return (
    <div style={{
      margin: '2rem 0 0',
      padding: '2rem',
      borderRadius: 20,
      background: bg,
      border: `1px solid ${bdr}`,
      backdropFilter: 'blur(12px)',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 24px rgba(15,110,86,0.06)',
    }}>
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🙏</div>
          <p style={{ fontWeight: 700, color: textColor, fontSize: '1rem', margin: '0 0 0.25rem' }}>Thank you for your feedback!</p>
          <p style={{ color: muteColor, fontSize: '0.85rem', margin: 0 }}>Your review has been recorded and will help us improve.</p>
        </div>
      ) : (
        <>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                Rate Your Experience ⭐
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: muteColor }}>
                Help us improve Swasthya Setu — your feedback matters
              </p>
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: '#0F6E56',
              background: 'rgba(15,110,86,0.1)', padding: '3px 10px',
              borderRadius: 99, border: '1px solid rgba(15,110,86,0.2)',
            }}>
              स्वास्थ्य सेतु
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Star rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: muteColor }}>Overall Rating:</span>
              <StarRating value={overall} onChange={setOverall} size={24} />
              {overall > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][overall]}
                </span>
              )}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Share your thoughts, suggestions, or any issues you faced…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.75rem 1rem', borderRadius: 12,
                border: `1.5px solid ${inputBdr}`,
                background: inputBg, color: textColor,
                fontSize: '0.875rem', resize: 'vertical',
                marginBottom: '1rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.18s',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#0F6E56'}
              onBlur={e => e.target.style.borderColor = inputBdr}
            />

            <button
              type="submit"
              disabled={overall === 0}
              style={{
                padding: '0.7rem 2rem', borderRadius: 12,
                border: 'none',
                background: overall === 0 ? (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb') : '#0F6E56',
                color: overall === 0 ? muteColor : '#fff',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: overall === 0 ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (overall > 0) e.currentTarget.style.background = '#0a5240' }}
              onMouseLeave={e => { if (overall > 0) e.currentTarget.style.background = '#0F6E56' }}
            >
              Submit Feedback
            </button>
          </form>
        </>
      )}
    </div>
  )
}
