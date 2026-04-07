import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const API = 'https://swasthya-setu-full.onrender.com/api/v1'

const DistrictHeatmap = lazy(() => import('../components/DistrictHeatmap'))

// District map centres
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

const SEVERITY_COLOR = { red: '#ef4444', yellow: '#f59e0b', green: '#22c55e' }
const SEVERITY_BG    = { red: '#fee2e2', yellow: '#fef3c7', green: '#dcfce7' }
const SEVERITY_LABEL = { red: 'Emergency', yellow: 'Moderate', green: 'Mild' }

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

// Build heatmap points from triage records grouped by village
function buildMapPoints(records, district, center) {
  const districtRecords = records.filter(r => r.district === district)
  if (districtRecords.length === 0) return []

  // Group by patient_name as village proxy (or use district as fallback)
  const groups = {}
  districtRecords.forEach(r => {
    const village = r.patient_name || 'Unknown'
    if (!groups[village]) {
      groups[village] = { village, total: 0, critical: 0, moderate: 0, mild: 0,
        lastReported: r.created_at, ashaWorker: '—' }
    }
    const g = groups[village]
    g.total++
    if (r.severity === 'red')    g.critical++
    else if (r.severity === 'yellow') g.moderate++
    else                              g.mild++
    if (r.created_at > g.lastReported) g.lastReported = r.created_at
  })

  const vals = Object.values(groups)
  return vals.map((g, i) => {
    const angle  = (i / vals.length) * 2 * Math.PI
    const radius = 0.06 + (i % 4) * 0.08
    return {
      ...g,
      lat: center[0] + Math.sin(angle) * radius,
      lng: center[1] + Math.cos(angle) * radius,
      lastReported: new Date(g.lastReported).toLocaleString('en-IN'),
    }
  })
}

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const _saved      = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const dmoName     = _saved.full_name  || 'DMO'
  const dmoDistrict = _saved.district   || 'Pune'
  const center      = DISTRICT_CENTERS[dmoDistrict] || [19.7515, 75.7139]
  const bounds      = DISTRICT_BOUNDS[dmoDistrict]  || null

  const [triageRecords, setTriageRecords] = useState([])
  const [patients,      setPatients]      = useState([])
  const [mapPoints,     setMapPoints]     = useState([])
  const [lastRefresh,   setLastRefresh]   = useState(new Date())
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState('all')      // all | red | yellow | green
  const [reviewing,     setReviewing]     = useState(null)       // record id being marked reviewed
  const [showConfirm,   setShowConfirm]   = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [triRes, patRes] = await Promise.all([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/patients/`,       { headers }),
      ])

      const allTriage   = triRes.ok   ? await triRes.json()   : []
      const allPatients = patRes.ok   ? await patRes.json()   : []

      const myTriage   = (allTriage   || []).filter(r => r.district === dmoDistrict)
      const myPatients = (allPatients || []).filter(p => p.district === dmoDistrict)

      setTriageRecords(myTriage)
      setPatients(myPatients)
      setMapPoints(buildMapPoints(allTriage || [], dmoDistrict, center))
    } catch (err) {
      console.error('DMO fetch error:', err)
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

  async function markReviewed(recordId) {
    setReviewing(recordId)
    try {
      const token = localStorage.getItem('access_token')
      await fetch(`${API}/triage_records/${recordId}/reviewed`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setTriageRecords(prev => prev.map(r => r.id === recordId ? { ...r, reviewed: true } : r))
    } catch (err) {
      console.error('Review error:', err)
    } finally {
      setReviewing(null)
    }
  }

  // Stats
  const redCount      = triageRecords.filter(r => r.severity === 'red').length
  const yellowCount   = triageRecords.filter(r => r.severity === 'yellow').length
  const greenCount    = triageRecords.filter(r => r.severity === 'green').length
  const sickleCount   = triageRecords.filter(r => r.sickle_cell_risk).length
  const unreviewedCnt = triageRecords.filter(r => !r.reviewed).length

  const visibleRecords = activeTab === 'all'
    ? triageRecords
    : triageRecords.filter(r => r.severity === activeTab)

  const stats = [
    { label: 'Emergency',      sub: 'RED cases',         value: redCount,      color: '#dc2626', bg: '#fee2e2' },
    { label: 'Moderate',       sub: 'YELLOW cases',      value: yellowCount,   color: '#d97706', bg: '#fef3c7' },
    { label: 'Mild',           sub: 'GREEN cases',       value: greenCount,    color: '#16a34a', bg: '#dcfce7' },
    { label: 'Sickle Cell',    sub: 'At-risk patients',  value: sickleCount,   color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Unreviewed',     sub: 'Pending review',    value: unreviewedCnt, color: '#0369a1', bg: '#e0f2fe' },
    { label: 'Total Patients', sub: 'Registered',        value: patients.length, color: '#475569', bg: '#f1f5f9' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#f1f5f9', padding: '1.5rem' }}>
      <style>{`
        @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.92)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .dcard  { background:#fff; border-radius:16px; box-shadow:0 2px 16px rgba(0,0,0,.06); padding:1.5rem; animation:fadeInUp .35s ease both; }
        .live-dot { display:inline-block;width:9px;height:9px;background:#22c55e;border-radius:50%;margin-right:6px;animation:pulse 1.6s ease-in-out infinite; }
        .scard  { transition:all .18s; cursor:default; }
        .scard:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,.1); }
        .tab-btn { padding:6px 16px; border-radius:999px; border:1.5px solid #e2e8f0; background:#fff;
          cursor:pointer; font-size:.82rem; font-weight:700; color:#475569; transition:all .15s; }
        .tab-btn.active { border-color:currentColor; }
        .tbl-row:hover { background:#f8fafc !important; }
        .modal-bg { position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;
          justify-content:center;z-index:1000;backdrop-filter:blur(4px); }
        .modal-box { background:#fff;border-radius:20px;padding:2rem 2.5rem;width:100%;max-width:420px;
          box-shadow:0 24px 60px rgba(0,0,0,.18); }
      `}</style>

      {/* Admin confirm modal */}
      {showConfirm && (
        <div className="modal-bg" onClick={() => setShowConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>🔐</div>
            <h2 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem' }}>Switch to Admin Mode?</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Admin mode shows the heatmap of <strong>all districts</strong>.<br />You will need admin credentials to proceed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
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

      {/* ── Header ── */}
      <header className="dcard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '1.1rem 1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏥</span>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              <span style={{ color: '#6366f1' }}>DMO</span>
              <span style={{ color: '#cbd5e1', margin: '0 8px' }}>·</span>
              <span style={{ color: '#334155' }}>{dmoDistrict} District</span>
            </h1>
          </div>
          <p style={{ margin: '3px 0 0 2.1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            {dmoName} &nbsp;·&nbsp; Outbreak Intelligence Dashboard
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', background: '#dcfce7', color: '#16a34a',
            padding: '4px 11px', borderRadius: '999px', fontWeight: 700, fontSize: '0.75rem' }}>
            <span className="live-dot" />LIVE
          </span>
          <button onClick={() => setShowConfirm(true)}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: 'pointer', fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>
            🔐 Admin
          </button>
          <button onClick={() => { logout(); localStorage.removeItem('dmo_bypass'); navigate('/') }}
            style={{ padding: '0.5rem 1.1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.82rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="dcard scard" style={{ textAlign: 'center', animationDelay: `${i * 0.06}s` }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {loading ? '…' : s.value}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#334155' }}>{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Heatmap ── */}
      <div className="dcard" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              {dmoDistrict} — Live Case Heatmap
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          </div>
          <button onClick={fetchData}
            style={{ padding: '5px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
            ↺ Refresh
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
          {[['#ef4444','RED — Emergency'],['#f59e0b','YELLOW — Moderate'],['#22c55e','GREEN — Mild']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', borderRadius: 10, color: '#94a3b8' }}>Loading map…</div>
        ) : mapPoints.length === 0 ? (
          <div style={{ height: 420, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', gap: 8 }}>
            <span style={{ fontSize: '2rem' }}>🗺️</span>
            <span style={{ fontWeight: 600 }}>No triage data yet for {dmoDistrict}</span>
            <span style={{ fontSize: '0.8rem' }}>Map will populate as ASHA workers submit records</span>
          </div>
        ) : (
          <MapErrorBoundary>
            <Suspense fallback={
              <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f8fafc', borderRadius: 10, color: '#94a3b8' }}>Loading map…</div>
            }>
              <DistrictHeatmap district={dmoDistrict} points={mapPoints} center={center} bounds={bounds} />
            </Suspense>
          </MapErrorBoundary>
        )}
      </div>

      {/* ── Triage Records ── */}
      <div className="dcard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
            Triage Records — {dmoDistrict}
            {triageRecords.length > 0 && (
              <span style={{ marginLeft: 10, background: '#ede9fe', color: '#6d28d9',
                padding: '2px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700 }}>
                {triageRecords.length} total
              </span>
            )}
          </h3>
          {/* Severity filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all','red','yellow','green'].map(t => (
              <button key={t} className={`tab-btn${activeTab === t ? ' active' : ''}`}
                style={{ color: t === 'all' ? '#475569' : SEVERITY_COLOR[t],
                  borderColor: activeTab === t ? (t === 'all' ? '#475569' : SEVERITY_COLOR[t]) : '#e2e8f0',
                  background: activeTab === t ? (t === 'all' ? '#f1f5f9' : SEVERITY_BG[t]) : '#fff' }}
                onClick={() => setActiveTab(t)}>
                {t === 'all' ? 'All' : SEVERITY_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading…</p>
        ) : visibleRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No {activeTab !== 'all' ? SEVERITY_LABEL[activeTab] : ''} records in {dmoDistrict}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Patient','Symptoms','Severity','Sickle Cell','Date','Status'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 0.85rem', color: '#64748b', fontWeight: 700,
                      fontSize: '0.78rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((r, i) => (
                  <tr key={r.id} className="tbl-row"
                    style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '0.8rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.patient_name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.source === 'helpline_call' ? '📞 Helpline' : '📱 App'}</div>
                    </td>
                    <td style={{ padding: '0.8rem 0.85rem', maxWidth: 200 }}>
                      {Array.isArray(r.symptoms) && r.symptoms.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.symptoms.slice(0, 3).map(s => (
                            <span key={s} style={{ background: '#f1f5f9', color: '#475569',
                              padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>{s}</span>
                          ))}
                          {r.symptoms.length > 3 && (
                            <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>+{r.symptoms.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{r.brief || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.85rem' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700,
                        background: SEVERITY_BG[r.severity]  || '#f1f5f9',
                        color:      SEVERITY_COLOR[r.severity] || '#475569',
                      }}>
                        {(r.severity || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.85rem' }}>
                      {r.sickle_cell_risk ? (
                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 9px',
                          borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700 }}>YES</span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.85rem', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.8rem 0.85rem' }}>
                      {r.reviewed ? (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.78rem' }}>✓ Reviewed</span>
                      ) : (
                        <button
                          disabled={reviewing === r.id}
                          onClick={() => markReviewed(r.id)}
                          style={{ padding: '4px 11px', borderRadius: '8px', border: '1.5px solid #0369a1',
                            background: reviewing === r.id ? '#e0f2fe' : '#fff', cursor: reviewing === r.id ? 'wait' : 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>
                          {reviewing === r.id ? '…' : 'Mark Reviewed'}
                        </button>
                      )}
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
