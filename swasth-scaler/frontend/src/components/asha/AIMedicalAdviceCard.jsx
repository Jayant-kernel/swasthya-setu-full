import { useState } from 'react'
import { apiFetch } from '../../lib/api'

export default function AIMedicalAdviceCard({
  symptoms = [],
  severity = 'moderate',
  patientGender = 'unknown',
  patientAge = 0
}) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  async function fetchAISuggestion() {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
      const response = await apiFetch(`${apiUrl}/triage_records/ai-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptoms,
          severity,
          patient_gender: patientGender,
          patient_age: patientAge,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to get AI suggestion')
      }

      const data = await response.json()
      setSuggestion(data.suggestion)
      setExpanded(true)
    } catch (err) {
      setError(err.message || 'Error getting AI suggestion')
      console.error('AI suggestion error:', err)
    } finally {
      setLoading(false)
    }
  }

  const severityConfig = {
    red: {
      bg: '#FDF2F2',
      border: '#F5B7B1',
      color: '#C0392B',
      dot: '#E74C3C',
      label: 'Emergency',
    },
    yellow: {
      bg: '#FEF9E7',
      border: '#F8D7A0',
      color: '#B7770D',
      dot: '#F39C12',
      label: 'Moderate',
    },
    green: {
      bg: '#EAFAF1',
      border: '#A9DFBF',
      color: '#1E8449',
      dot: '#27AE60',
      label: 'Stable',
    },
  }

  const config = severityConfig[severity?.toLowerCase()] || severityConfig.green

  return (
    <div
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F6E56 0%, #0D5644 100%)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🏥</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: '0.875rem',
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            AI Medical Assistant
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: 1,
            }}
          >
            Hugging Face · LLAMA3-3B-Medical-COT
          </div>
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.8)',
            padding: '2px 8px',
            borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          AI-POWERED
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem' }}>
        {/* Patient Info */}
        <div
          style={{
            fontSize: '0.8125rem',
            color: config.color,
            marginBottom: '0.875rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {patientAge > 0 && (
            <span>
              <strong>Age:</strong> {patientAge} years
            </span>
          )}
          {patientGender !== 'unknown' && (
            <span>
              <strong>Gender:</strong> {patientGender}
            </span>
          )}
          <span>
            <strong>Severity:</strong> {config.label}
          </span>
        </div>

        {/* Symptoms List */}
        {symptoms && symptoms.length > 0 && (
          <div style={{ marginBottom: '0.875rem' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: config.color,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '0.375rem',
              }}
            >
              Symptoms Analyzed
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {symptoms.map((s, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: `1px solid ${config.border}`,
                    borderRadius: 6,
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.8125rem',
                    color: config.color,
                    fontWeight: 500,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ask AI Button */}
        <button
          onClick={fetchAISuggestion}
          disabled={loading}
          style={{
            width: '100%',
            minHeight: 44,
            background: loading ? config.dot : config.dot,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.9375rem',
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.8 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Getting suggestions…
            </>
          ) : (
            <>
              💡 Ask AI for Medical Advice
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: '0.75rem',
              background: '#FEE',
              border: '1px solid #FCC',
              borderRadius: 8,
              padding: '0.75rem',
              fontSize: '0.8125rem',
              color: '#C0392B',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* AI Suggestion Result */}
        {suggestion && expanded && (
          <div
            style={{
              marginTop: '0.875rem',
              background: 'rgba(255,255,255,0.7)',
              border: `1.5px solid ${config.border}`,
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: config.color,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '0.625rem',
              }}
            >
              AI Recommendation (4-5 Key Points)
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {suggestion}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#9CA3AF',
                marginTop: '0.75rem',
                fontStyle: 'italic',
              }}
            >
              ⚠ Disclaimer: This is AI-generated medical information only. Not a substitute for professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
