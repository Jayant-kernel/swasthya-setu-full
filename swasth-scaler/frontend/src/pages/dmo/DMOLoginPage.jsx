import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function DMOLoginPage() {
  const navigate = useNavigate()
  const { login, loginAsGuest } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password, 'dmo')
      navigate('/dashboard/dmo')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestSignIn() {
    setLoading(true)
    setError('')
    try {
      await loginAsGuest('dmo')
      navigate('/dashboard/dmo')
    } catch (err) {
      setError('Guest sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ 
          background: 'var(--color-primary)', 
          margin: '-1.25rem -1.25rem 1.5rem', 
          padding: '2rem', 
          textAlign: 'center',
          color: 'var(--surface)' 
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            District Medical Officer Login
          </h1>
          <div style={{ fontWeight: 600, opacity: 0.9 }}>
            जिल्हा वैद्यकीय अधिकारी लॉगिन
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Email Address
              <span className="marathi-label" style={{ marginLeft: '0.5rem', opacity: 0.6 }}>ईमेल पत्ता</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="Demo: dmo.demo@health.maha.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              <span className="marathi-label" style={{ marginLeft: '0.5rem', opacity: 0.6 }}>पासवर्ड</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Demo password: guest1234"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In / लॉगिन करा'}
          </button>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="btn"
            style={{ marginTop: '0.875rem', width: '100%', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', fontWeight: 700 }}
          >
            👤 Continue as Guest (DMO Demo)
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/login/asha" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Are you an ASHA Worker? Login here →
          </Link>
          <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            ← Back to role selection
          </Link>
        </div>
      </div>
    </div>
  )
}
