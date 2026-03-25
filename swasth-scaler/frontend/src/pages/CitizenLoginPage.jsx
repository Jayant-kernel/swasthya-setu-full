import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function CitizenLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // For demo purposes, we'll try to login with email (phone + @citizen.com)
      const email = `${phone}@citizen.com`
      await login(email, password, 'citizen')
      navigate('/dashboard/citizen')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Citizen Portal / ନାଗରିକ ପୋର୍ଟାଲ
          </h1>
          <p className="text-muted">Sign in to access your health records</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Mobile Number
              <span className="odia-label">ମୋବାଇଲ ନଂ</span>
            </label>
            <div className="input-prefix-group">
              <span className="input-prefix">+91</span>
              <input
                type="tel"
                className="input-prefix-field"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
              <span className="odia-label">ପାସୱାର୍ଡ</span>
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
            {loading ? 'Please wait...' : 'Sign In / ସାଇନ ଇନ'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/register/citizen" style={{ fontSize: '0.875rem' }}>New user? Register here</Link>
          <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>← Back to role selection</Link>
        </div>
      </div>
    </div>
  )
}
