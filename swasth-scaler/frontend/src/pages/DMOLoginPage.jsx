import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DMOLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
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

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ 
          background: 'var(--color-primary)', 
          margin: '-1.25rem -1.25rem 1.5rem', 
          padding: '2rem', 
          textAlign: 'center',
          color: '#fff' 
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            District Medical Officer Login
          </h1>
          <div style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", opacity: 0.9 }}>
            ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ ଲଗଇନ୍
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Email Address
              <span className="odia-label">ईमेल पत्ता</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              <span className="odia-label">पासवर्ड</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In / लॉग इन करा'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            ← Back to role selection
          </Link>
        </div>
      </div>
    </div>
  )
}
