import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Heart-pulse SVG logo
function LogoIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <rect width="52" height="52" rx="14" fill="var(--color-primary)" />
      <path
        d="M10 26h6l4-8 6 16 4-12 3 6h9"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success, Supabase redirects to Google — no further action needed here
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo('Account created! Check your email to confirm, then sign in.')
        setIsSignUp(false)
      } else {
        localStorage.setItem('userRole', 'asha')
        navigate('/home')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Top banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
            padding: '2.5rem 2rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          <LogoIcon />
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Swasthya Setu
            </h1>
            <div
              style={{
                fontFamily: "'Noto Sans Oriya', sans-serif",
                color: 'rgba(255,255,255,0.85)',
                fontSize: '1.125rem',
                fontWeight: 500,
              }}
            >
              ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Healthcare Bridge for Rural Odisha
            </p>
            <p
              style={{
                fontFamily: "'Noto Sans Oriya', sans-serif",
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
              }}
            >
              ଗ୍ରାମୀଣ ଓଡ଼ିଶା ପାଇଁ ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ
            </p>
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '2rem 1.5rem' }}>
          {/* Error / Info alerts */}
          {error && (
            <div className="alert alert-error" role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}
          {info && !error && (
            <div className="alert alert-success" role="status">
              <span aria-hidden="true">✓</span> {info}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.8125rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: '#fff',
              color: 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: googleLoading || loading ? 'not-allowed' : 'pointer',
              marginBottom: '1.25rem',
              transition: 'box-shadow 0.15s, border-color 0.15s',
              opacity: googleLoading || loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = '#aaa' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
          >
            {googleLoading ? (
              <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.2 33.3 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l6-6C34.4 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20-8 20-20.5 0-1.4-.1-2.7-.5-5z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.8 1.1 7.9 2.9l6-6C34.4 6.5 29.5 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
                <path fill="#FBBC05" d="M24 45.5c5.4 0 10.2-1.8 13.9-4.8l-6.4-5.3C29.5 37 26.9 38 24 38c-5.6 0-10.2-3.7-11.8-8.7l-7 5.4C8.3 41.5 15.6 45.5 24 45.5z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.3-4.3 5.7l6.4 5.3C41.8 36.3 44.5 31 44.5 25c0-1.4-.1-2.7-.5-5z"/>
              </svg>
            )}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
                <span className="odia-label">ଇମେଲ ଠିକଣା</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
                <span className="odia-label">ପାସୱାର୍ଡ</span>
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem', marginBottom: '0.875rem' }}
            >
              {loading ? (
                <><span className="spinner" />{isSignUp ? 'Creating account…' : 'Signing in…'}</>
              ) : isSignUp ? (
                <>Create Account <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.9375rem' }}>/ ଖାତା ତୈରି କରନ୍ତୁ</span></>
              ) : (
                <>Sign In <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.9375rem' }}>/ ସାଇନ ଇନ</span></>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading}
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setInfo('') }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </form>

          {/* Footer note */}
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              marginTop: '1.5rem',
            }}
          >
            For ASHA Workers &amp; Healthcare Volunteers
            <br />
            <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif" }}>
              ଆଶା କର୍ମୀ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ସ୍ୱୟଂସେବକଙ୍କ ପାଇଁ
            </span>
          </p>

          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <Link
              to="/"
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              ← Back to role selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
