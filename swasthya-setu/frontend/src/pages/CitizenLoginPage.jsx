import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function CitizenLoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSendOtp(e) {
    e.preventDefault()
    if (phone.length < 10) { setError('Enter a valid 10-digit phone number.'); return }
    setError(''); setLoading(true)
    setTimeout(() => { setLoading(false); setStep('otp') }, 800)
  }

  function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length < 4) { setError('Enter the OTP sent to your phone.'); return }
    setError(''); setLoading(true)
    setTimeout(() => { localStorage.setItem('userRole', 'citizen'); navigate('/dashboard/citizen') }, 800)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏥</div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.25rem' }}>Citizen Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem' }}>Access your health records &amp; services</p>
        </div>
        <div style={{ padding: '2rem 1.5rem' }}>
          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Mobile Number <span className="odia-label">ମୋବାଇଲ ନମ୍ବର</span></label>
                <input type="tel" className="form-input" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Sending…</> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>OTP sent to +91 {phone}</p>
              <div className="form-group">
                <label className="form-label">Enter OTP <span className="odia-label">OTP ପ୍ରବେଶ କରନ୍ତୁ</span></label>
                <input type="text" className="form-input" placeholder="4-6 digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginBottom: '0.75rem' }}>
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & Login'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setStep('phone'); setOtp(''); setError('') }}>← Change number</button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link to="/register/citizen" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>New user? Register here</Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>← Back to role selection</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
