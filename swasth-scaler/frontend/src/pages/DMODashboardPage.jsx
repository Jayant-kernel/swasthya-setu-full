import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ADMIN_ID = 'ADMIN001'
const ADMIN_PASS = 'swasthya@2024'

const DistrictHeatmap = lazy(() => import('../components/DistrictHeatmap'))

const DISTRICT_CENTERS = {
  'Pune':        [18.5204, 73.8567],
  'Mumbai':      [19.0760, 72.8777],
  'Nagpur':      [21.1458, 79.0882],
  'Nashik':      [20.0059, 73.7897],
  'Ahmednagar':  [19.0948, 74.7480],
  'Aurangabad':  [19.8762, 75.3433],
  'Solapur':     [17.6805, 75.9064],
  'Kolhapur':    [16.7050, 74.2433],
  'Thane':       [19.2183, 72.9781],
  'Satara':      [17.6805, 74.0183],
  'Sangli':      [16.8524, 74.5815],
}

// Tight bounding boxes per district [southWest, northEast]
const DISTRICT_BOUNDS = {
  'Pune':       [[17.85, 73.20], [19.20, 74.70]],
  'Mumbai':     [[18.85, 72.70], [19.35, 73.10]],
  'Nagpur':     [[20.60, 78.40], [21.70, 79.80]],
  'Nashik':     [[19.40, 73.20], [20.60, 74.60]],
  'Ahmednagar': [[18.40, 74.00], [19.70, 75.40]],
  'Aurangabad': [[19.30, 74.70], [20.40, 76.00]],
  'Solapur':    [[17.00, 75.30], [18.20, 76.60]],
  'Kolhapur':   [[15.90, 73.60], [17.00, 75.00]],
  'Thane':      [[18.80, 72.70], [19.80, 73.50]],
  'Satara':     [[17.00, 73.50], [18.20, 74.80]],
  'Sangli':     [[16.40, 73.90], [17.40, 75.20]],
}

function getCenter(district) {
  return DISTRICT_CENTERS[district] || [19.7515, 75.7139]
}

function getBounds(district) {
  return DISTRICT_BOUNDS[district] || null
}

function getDemoDots(district) {
  const c = getCenter(district)
  return [
    { village: 'Area A', lat: c[0]+0.12, lng: c[1]+0.15, total: 8,  critical: 2, moderate: 3, mild: 3, lastReported: 'No data', ashaWorker: '—' },
    { village: 'Area B', lat: c[0]-0.18, lng: c[1]+0.08, total: 5,  critical: 0, moderate: 2, mild: 3, lastReported: 'No data', ashaWorker: '—' },
    { village: 'Area C', lat: c[0]+0.06, lng: c[1]-0.20, total: 11, critical: 4, moderate: 4, mild: 3, lastReported: 'No data', ashaWorker: '—' },
  ]
}

class MapErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', borderRadius: 10, color: '#94a3b8' }}>Map unavailable</div>
    )
    return this.props.children
  }
}

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const _saved     = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const dmoName    = _saved.full_name  || localStorage.getItem('dmoName')     || 'DMO'
  const dmoDistrict = _saved.district || localStorage.getItem('dmoDistrict') || 'Pune'
  const center     = getCenter(dmoDistrict)
  const bounds     = getBounds(dmoDistrict)

  const [patients,    setPatients]    = useState([])
  const [mapPoints,   setMapPoints]   = useState([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [loading,     setLoading]     = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/patients/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('fetch failed')
      const all = await res.json()
      const rows = (all || []).filter(r => r.district === dmoDistrict)
      setPatients(rows)

      if (rows.length === 0) {
        setMapPoints(getDemoDots(dmoDistrict))
      } else {
        const groups = {}
        rows.forEach(r => {
          const key = r.gender || 'Unknown'
          if (!groups[key]) groups[key] = { village: `${key} patients`, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
          groups[key].total++
          if (r.age < 18 || r.age > 60) groups[key].critical++
          else if (r.age <= 40)          groups[key].mild++
          else                           groups[key].moderate++
          if (r.created_at > groups[key].lastReported) groups[key].lastReported = r.created_at
        })
        const vals = Object.values(groups)
        setMapPoints(vals.map((g, i) => {
          const angle  = (i / vals.length) * 2 * Math.PI
          const radius = 0.08 + (i % 3) * 0.10
          return { ...g, lat: center[0] + Math.sin(angle) * radius, lng: center[1] + Math.cos(angle) * radius,
            lastReported: new Date(g.lastReported).toLocaleString(), ashaWorker: '—' }
        }))
      }
    } catch {
      setMapPoints(getDemoDots(dmoDistrict))
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [dmoDistrict, center])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [fetchData])

  const totalPatients = patients.length
  const femaleCount   = patients.filter(p => p.gender === 'Female').length
  const seniorCount   = patients.filter(p => p.age > 60).length
  const recentCount   = patients.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 7*24*60*60*1000).length

  const stats = [
    { label: 'Total Patients',  sub: 'ମୋଟ ରୋଗୀ',      value: totalPatients, color: '#6366f1', bg: '#ede9fe' },
    { label: 'This Week',       sub: 'ଏହି ସପ୍ତାହ',    value: recentCount,   color: '#d97706', bg: '#fef3c7' },
    { label: 'High Risk (60+)', sub: 'ଚିହ୍ନିତ କେସ୍',  value: seniorCount,   color: '#dc2626', bg: '#fee2e2' },
    { label: 'Female Patients', sub: 'ମହିଳା ରୋଗୀ',    value: femaleCount,   color: '#16a34a', bg: '#dcfce7' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#f1f5f9', padding: '1.5rem' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.92)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dmo-card { background:#fff; border-radius:16px; box-shadow:0 2px 16px rgba(0,0,0,.06); padding:1.5rem; animation:fadeInUp .4s ease both; }
        .live-dot { display:inline-block;width:9px;height:9px;background:#22c55e;border-radius:50%;margin-right:6px;animation:pulse 1.6s ease-in-out infinite; }
        .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px); }
        .modal-box { background:#fff;border-radius:20px;padding:2rem 2.5rem;width:100%;max-width:420px;box-shadow:0 24px 60px rgba(0,0,0,0.18); }
        .stat-card:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,.1); transition:all .2s; }
        .tbl-row:hover { background:#f8fafc !important; }
      `}</style>

      {/* Admin confirm modal */}
      {showConfirm && (
        <div className="modal-bg" onClick={() => setShowConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>🔐</div>
            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem' }}>Switch to Admin Mode?</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Admin mode shows the heatmap of <strong>all districts across India</strong>.<br />You will need admin credentials to proceed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                Cancel
              </button>
              <button onClick={() => { localStorage.setItem('admin_bypass', 'true'); setShowConfirm(false); navigate('/dashboard/admin') }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: 'pointer', fontWeight: 700, color: '#fff' }}>
                Yes, Switch →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="dmo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '1.25rem 1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              <span style={{ color: '#6366f1' }}>DMO</span>
              <span style={{ color: '#cbd5e1', margin: '0 8px' }}>·</span>
              <span style={{ color: '#334155' }}>{dmoDistrict} District</span>
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 2.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
            District Medical Officer Dashboard &nbsp;/&nbsp; ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ ଡ୍ୟାସବୋର୍ଡ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={() => setShowConfirm(true)}
            style={{ padding: '0.55rem 1.2rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: 'pointer', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
            🔐 Admin Mode
          </button>
          <button onClick={() => {
            logout()
            localStorage.removeItem('dmo_bypass')
            localStorage.removeItem('dmoName')
            localStorage.removeItem('dmoDistrict')
            localStorage.removeItem('dmoEmpId')
            navigate('/')
          }} style={{ padding: '0.55rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0',
            background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="dmo-card stat-card" style={{ textAlign: 'center', animationDelay: `${i * 0.07}s`, cursor: 'default', transition: 'all .2s' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {loading ? '…' : s.value}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>{s.label}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="dmo-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
              {dmoDistrict} District — Live Case Heatmap
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', background: '#dcfce7', color: '#16a34a',
              padding: '4px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.78rem' }}>
              <span className="live-dot" />LIVE
            </span>
            <button onClick={fetchData}
              style={{ padding: '5px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
                background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
              ↺ Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[['#ef4444','High Risk (age <18 or >60)'],['#f59e0b','Moderate (41–60)'],['#22c55e','Low Risk (18–40)']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c }} />{l}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', borderRadius: 10, color: '#94a3b8' }}>Loading map…</div>
        ) : (
          <MapErrorBoundary>
            <Suspense fallback={<div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f8fafc', borderRadius: 10, color: '#94a3b8' }}>Loading map…</div>}>
              <DistrictHeatmap district={dmoDistrict} points={mapPoints} center={center} bounds={bounds} />
            </Suspense>
          </MapErrorBoundary>
        )}
      </div>

      {/* Patient table */}
      <div className="dmo-card">
        <h3 style={{ margin: '0 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
          Patient Records — {dmoDistrict}
          {patients.length > 0 && (
            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>
              {patients.length} total
            </span>
          )}
        </h3>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading…</p>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏥</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No patients registered in {dmoDistrict} yet.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>Patient records will appear here once ASHA workers submit triage data.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderRadius: 8 }}>
                  {['Name','Age','Gender','District','Registered'].map(h => (
                    <th key={h} style={{ padding: '0.7rem 0.85rem', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={p.id} className="tbl-row" style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fafafa' : '#fff', cursor: 'default' }}>
                    <td style={{ padding: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{p.name}</td>
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                        background: (p.age < 18 || p.age > 60) ? '#fee2e2' : p.age > 40 ? '#fef3c7' : '#dcfce7',
                        color:      (p.age < 18 || p.age > 60) ? '#dc2626' : p.age > 40 ? '#92400e' : '#16a34a',
                      }}>{p.age}</span>
                    </td>
                    <td style={{ padding: '0.85rem', color: '#475569' }}>{p.gender}</td>
                    <td style={{ padding: '0.85rem', color: '#475569' }}>{p.district}</td>
                    <td style={{ padding: '0.85rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
