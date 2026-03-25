import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CitizenDashboardPage() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('userRole')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>Citizen Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', fontFamily: "'Noto Sans Oriya', sans-serif" }}>ନାଗରିକ ଡ୍ୟାସବୋର୍ଡ</p>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Logout</button>
      </div>
      <div style={{ padding: '2rem 1rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Coming Soon</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Full citizen features including health records, appointment booking, and NHM scheme eligibility are under development.</p>
      </div>
    </div>
  )
}
