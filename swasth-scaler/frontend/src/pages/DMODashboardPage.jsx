import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const dmoName = localStorage.getItem('dmoName') || 'Dr. Saroj Kumar'
  const dmoDistrict = localStorage.getItem('dmoDistrict') || 'Ganjam'

  const stats = [
    { label: 'Total ASHA Workers', value: '1,240', sub: 'ମୋଟ ଆଶା କର୍ମୀ' },
    { label: 'Pending Reports', value: '84', sub: 'ବାକି ଥିବା ରିପୋର୍ଟ' },
    { label: 'Flagged Cases', value: '12', sub: 'ଚିହ୍ନିତ କେସ୍' },
    { label: 'Villages Covered', value: '450', sub: 'ଅନ୍ତର୍ଭୁକ୍ତ ଗ୍ରାମ' }
  ]

  const records = [
    { id: 1, name: 'Swayam Prabha', village: 'Berhampur', symptoms: 'Fever, Cough', status: 'Pending', time: '2h ago' },
    { id: 2, name: 'Rajlaxmi Khatua', village: 'Gopalpur', symptoms: 'Sickle Cell Risk', status: 'Reviewed', time: '5h ago' },
    { id: 3, name: 'Minati Das', village: 'Chatrapur', symptoms: 'Malnutrition', status: 'Pending', time: '1d ago' }
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', padding: '1.5rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)'
      }}>
        <div>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>
            {dmoName} · <span style={{ color: 'var(--color-text-muted)' }}>{dmoDistrict} District</span>
          </h1>
          <p className="text-muted">District Medical Officer Dashboard / ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ ଡ୍ୟାସବୋର୍ଡ</p>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={logout}>Logout</button>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              {stat.value}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{stat.label}</div>
            <div className="odia-label">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Recent ASHA Worker Submissions
          <span className="badge badge-yellow">Action Required</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>ASHA Worker</th>
                <th style={{ padding: '0.75rem' }}>Village</th>
                <th style={{ padding: '0.75rem' }}>Key Symptoms</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Received</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{rec.name}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>{rec.village}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>{rec.symptoms}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span className={`badge ${rec.status === 'Reviewed' ? 'badge-green' : 'badge-yellow'}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--color-text-muted)' }}>{rec.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
