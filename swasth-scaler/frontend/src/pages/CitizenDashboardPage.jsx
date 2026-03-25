import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function CitizenDashboardPage() {
  const { session, logout } = useAuth()
  const userName = session?.user?.user_metadata?.full_name || 'Citizen'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>Welcome, {userName}!</h1>
          <p className="text-muted">Welcome to your health portal / ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପୋର୍ଟାଲକୁ ସ୍ୱାଗତ</p>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={logout}>Logout</button>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}> My Health Records</h3>
          <p className="text-muted">View your previous consultations and reports</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}> Nearby ASHA Worker</h3>
          <p className="text-muted">Find health workers in your village</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}> Book Appointment</h3>
          <p className="text-muted">Schedule a visit to the nearest health center</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}> Health Schemes</h3>
          <p className="text-muted">Check eligibility for government schemes</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          Your Assigned ASHA Worker
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem' }}>👩🏽‍⚕️</div>
          <div>
            <div style={{ fontWeight: 600 }}>Smt. Mamata Das</div>
            <div className="text-muted">Village: Khuntuni</div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
              📞 +91 98765 43210
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
