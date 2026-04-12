import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext.jsx'

const API = 'https://swasthya-setu-full.onrender.com/api/v1'
const DistrictHeatmap = lazy(() =>
  import('../components/DistrictHeatmap').catch(err => {
    console.error("Chunk load error:", err);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        import('../components/DistrictHeatmap').then(resolve).catch(reject);
      }, 1000);
    });
  })
)

// ── Geography ──────────────────────────────────────────────────────────────

const DISTRICT_CENTERS = {
  // Odisha
  'Angul': [20.8400, 85.1000], 'Balangir': [20.7167, 83.4833],
  'Balasore': [21.4942, 86.9317], 'Bargarh': [21.3333, 83.6167],
  'Bhadrak': [21.0544, 86.4967], 'Boudh': [20.8500, 84.3167],
  'Cuttack': [20.4625, 85.8830], 'Deogarh': [21.5333, 84.7333],
  'Dhenkanal': [20.6597, 85.5975], 'Gajapati': [18.9842, 84.0974],
  'Ganjam': [19.3833, 84.9833], 'Jagatsinghpur': [20.2583, 86.1708],
  'Jajpur': [20.8495, 86.3344], 'Jharsuguda': [21.8550, 84.0061],
  'Kalahandi': [19.9120, 83.1687], 'Kandhamal': [20.1167, 84.2333],
  'Kendrapara': [20.5020, 86.4230], 'Kendujhar': [21.6289, 85.5812],
  'Khordha': [20.1824, 85.6239], 'Koraput': [18.8120, 82.7109],
  'Malkangiri': [18.3500, 81.8833], 'Mayurbhanj': [21.9418, 86.7341],
  'Nabarangpur': [19.2294, 82.5490], 'Nayagarh': [20.1269, 85.0955],
  'Nuapada': [20.8167, 82.5333], 'Puri': [19.8135, 85.8312],
  'Rayagada': [19.1700, 83.4167], 'Sambalpur': [21.4669, 83.9756],
  'Subarnapur': [20.8500, 83.9000], 'Sundargarh': [22.1167, 84.0333],
  'Berhampur': [19.3150, 84.7941],
  // Maharashtra
  'Mumbai': [19.0760, 72.8777], 'Pune': [18.5204, 73.8567],
  'Nagpur': [21.1458, 79.0882], 'Nashik': [20.0059, 73.7897],
  'Aurangabad': [19.8762, 75.3433], 'Solapur': [17.6805, 75.9064],
  'Amravati': [20.9320, 77.7523], 'Kolhapur': [16.7050, 74.2433],
  'Satara': [17.6805, 74.0183], 'Ahmednagar': [19.0948, 74.7480],
  'Thane': [19.2183, 72.9781], 'Jalgaon': [21.0077, 75.5626],
  'Latur': [18.4088, 76.5604], 'Dhule': [20.9042, 74.7749],
  'Chandrapur': [19.9615, 79.2961], 'Yavatmal': [20.3888, 78.1204],
}
const INDIA_CENTER = [22.5, 82.5]
const INDIA_BOUNDS = [[6.4627, 68.1097], [35.5133, 97.3954]]

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const MapIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const GlobeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const ActivityIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>

// ── Components ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6', g }) => (
  <div style={{ background: g.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: g.cardShd, border: `1px solid ${g.cardBdr}`, flex: 1, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>
        NATIONAL
      </div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: g.text }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>{subtext}</div>
  </div>
)

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [activeView, setActiveView] = useState('home')
  const [triageRecords, setTriageRecords] = useState([])
  const [outbreaks, setOutbreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [analyticsMode, setAnalyticsMode] = useState('cases') // 'cases' | 'outbreaks'

  const _savedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, outRes] = await Promise.allSettled([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/outbreaks/`, { headers }),
      ])
      if (triRes.status === 'fulfilled' && triRes.value.ok) {
        setTriageRecords(await triRes.value.json())
      }
      if (outRes.status === 'fulfilled' && outRes.value.ok) {
        const data = await outRes.value.json()
        setOutbreaks(Array.isArray(data) ? data : [])
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [fetchData])

  const stats = useMemo(() => {
    const total = triageRecords.length
    const critical = triageRecords.filter(r => r.severity === 'red').length
    const sickle = triageRecords.filter(r => r.sickle_cell_risk).length
    const districts = new Set(triageRecords.map(r => r.district).filter(Boolean)).size
    return { total, critical, sickle, districts }
  }, [triageRecords])

  const regionStats = useMemo(() => {
    const groups = {}
    triageRecords.forEach(r => {
      const d = r.district || 'General'
      if (!groups[d]) {
        groups[d] = {
          name: d, total: 0, critical: 0, moderate: 0, stable: 0,
          sickle: 0, app: 0, ivr: 0, lastUpdate: r.created_at
        }
      }
      groups[d].total++
      if (r.severity === 'red' || Number(r.severity) >= 7) groups[d].critical++
      else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) groups[d].moderate++
      else groups[d].stable++
      if (r.sickle_cell_risk) groups[d].sickle++
      if (r.source === 'helpline_call') groups[d].ivr++
      else groups[d].app++
      if (r.created_at > groups[d].lastUpdate) groups[d].lastUpdate = r.created_at
    })
    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [triageRecords])

  const outbreakRegionStats = useMemo(() => {
    const groups = {}
    outbreaks.forEach(o => {
      const d = o.district || 'General'
      if (!groups[d]) {
        groups[d] = {
          name: d, totalCases: 0, totalDeaths: 0,
          diseases: new Set(), lastUpdate: o.year ? `${o.year} W${o.week}` : 'N/A'
        }
      }
      groups[d].totalCases += (o.cases || 0)
      groups[d].totalDeaths += (o.deaths || 0)
      if (o.disease) groups[d].diseases.add(o.disease)
      // Basic heuristic for "last update" since we don't have ISO timestamps for outbreaks
      if (o.year && o.week) {
        const key = `${o.year}-${String(o.week).padStart(2, '0')}`
        if (!groups[d]._sortKey || key > groups[d]._sortKey) {
          groups[d]._sortKey = key
          groups[d].lastUpdate = `${o.year} Week ${o.week}`
        }
      }
    })
    return Object.values(groups).map(g => ({
      ...g,
      diseaseCount: g.diseases.size,
      topDiseases: Array.from(g.diseases).slice(0, 3).join(', ') + (g.diseases.size > 3 ? '...' : '')
    })).sort((a, b) => b.totalCases - a.totalCases)
  }, [outbreaks])

  const mapPoints = useMemo(() => {
    const withGps = triageRecords.filter(r => r.latitude && r.longitude)
    const withoutGps = triageRecords.filter(r => !r.latitude || !r.longitude)

    const gpsPoints = withGps.map(r => ({
      village: r.patient_name || 'Patient',
      total: 1,
      critical: r.severity === 'red' ? 1 : 0,
      moderate: r.severity === 'yellow' ? 1 : 0,
      mild: r.severity === 'green' ? 1 : 0,
      lastReported: new Date(r.created_at).toLocaleString('en-IN'),
      lat: r.latitude,
      lng: r.longitude,
      ashaWorker: r.user_name || undefined
    }))

    const groups = {}
    withoutGps.forEach(r => {
      const d = r.district || 'Unknown'
      if (!groups[d]) groups[d] = { village: d, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
      groups[d].total++
      if (r.severity === 'red') groups[d].critical++
      else if (r.severity === 'yellow') groups[d].moderate++
      else groups[d].mild++
      if (r.created_at > groups[d].lastUpdate) groups[d].lastReported = r.created_at
    })

    const legacyPoints = Object.entries(groups).map(([district, g]) => {
      const coords = DISTRICT_CENTERS[district]
      if (!coords) return null
      return {
        ...g,
        lat: coords[0],
        lng: coords[1],
        lastReported: new Date(g.lastReported).toLocaleString('en-IN')
      }
    }).filter(Boolean)

    return [...gpsPoints, ...legacyPoints]
  }, [triageRecords])

  const g = useMemo(() => ({
    panelBg: 'var(--g-panel-bg)',
    panelBdr: 'var(--g-panel-bdr)',
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)',
    btn: 'var(--g-btn)',
    btnBdr: 'var(--g-btn-bdr)',
    insetBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
  }), [isDark])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${g.divider}; border-radius: 10px; }
        .nav-link:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; color: ${g.accent}; }
        .nav-link.active { background: ${isDark ? 'rgba(79,70,229,0.15)' : '#eef2ff'}; color: #4f46e5; font-weight: 700; border-left: 3px solid #4f46e5; }
        .btn-primary { background: #4f46e5; color: #fff; border: none; padding: 0.5rem 1.25rem; borderRadius: 8px; fontWeight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
        .table-row:hover { background: ${g.insetBg}; cursor: pointer; }
        .live-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); } }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 260, background: g.cardBg, borderRight: `1px solid ${g.divider}`, display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: g.blur }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: g.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Swasthya Setu</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4, letterSpacing: '0.05em' }}>ADMIN PORTAL</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <div onClick={() => setActiveView('home')} className={`nav-link ${activeView === 'home' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
            <HomeIcon /> <span>Overview</span>
          </div>
          <div onClick={() => setActiveView('map')} className={`nav-link ${activeView === 'map' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
            <MapIcon /> <span>National Map</span>
          </div>
          <div onClick={() => setActiveView('analytics')} className={`nav-link ${activeView === 'analytics' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
            <GlobeIcon /> <span>Region Analytics</span>
          </div>
        </nav>

        <div style={{ padding: '1rem', borderTop: `1px solid ${g.divider}` }}>
          <div onClick={() => navigate('/dashboard/dmo')} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 8, border: `1px dashed ${g.divider}` }}>
            <span>💼</span> <span>DMO Dashboard</span>
          </div>
          <div onClick={() => { logout(); navigate('/') }} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer' }}>
            <LogoutIcon /> <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* Top Navbar */}
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: g.text }}>Administrator Mode</div>
              <div style={{ fontSize: '0.65rem', color: g.label, fontWeight: 600 }}>System Control Center</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>A</div>
          </div>
        </header>

        {/* Scrollable View */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>

          {activeView === 'home' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: '0 0 0.25rem' }}>National Health Command</h1>
                  <p style={{ margin: 0, color: g.muted, fontSize: '0.9375rem' }}>Aggregated data from all active districts and PHCs.</p>
                </div>
                <div style={{ color: g.label, fontSize: '0.8125rem', fontWeight: 600 }}>
                  Last Sync: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <StatCard label="Total Triage Instances" value={stats.total} subtext="Records across all states" icon={ActivityIcon} color="#4f46e5" g={g} />
                <StatCard label="Active Districts" value={stats.districts} subtext="Reporting real-time data" icon={GlobeIcon} color="#34d399" g={g} />
                <StatCard label="National Alerts (RED)" value={stats.critical} subtext="High-severity escalations" icon={ActivityIcon} color="#ef4444" g={g} />
              </div>

              {/* Patient Table */}
              <div style={{ background: g.cardBg, borderRadius: 16, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, overflow: 'hidden', backdropFilter: g.blur }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${g.divider}` }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>Recent Global Triage Events</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: g.insetBg }}>
                      <tr>
                        {['Patient', 'District', 'Severity', 'Date'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {triageRecords.slice(0, 15).map((record) => (
                        <tr key={record.id} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: 700, color: g.text, fontSize: '0.9375rem' }}>{record.patient_name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.75rem', color: g.muted }}>ID: {record.id?.substring(0, 8)}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.text, fontSize: '0.875rem', fontWeight: 600 }}>{record.district || 'General'}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{
                              fontSize: '0.875rem', fontWeight: 700,
                              color: (record.severity === 'red' || Number(record.severity) >= 7) ? '#ef4444' :
                                (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? '#f59e0b' : '#10b981'
                            }}>
                              {(record.severity === 'red' || Number(record.severity) >= 7) ? 'CRITICAL' :
                                (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? 'MODERATE' : 'STABLE'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.muted, fontSize: '0.8125rem' }}>
                            {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'map' && (
            <div style={{ height: 'calc(100vh - 72px - 5rem)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: 0 }}>National Health Heatmap</h1>
                <div style={{ fontSize: '0.8125rem', color: g.label, fontWeight: 600 }}>
                  {outbreaks.length} outbreak records · {mapPoints.length} triage clusters
                </div>
              </div>
              <div style={{ flex: 1, background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, overflow: 'hidden', minHeight: 500, backdropFilter: g.blur }}>
                <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>Loading National Map...</div>}>
                  <DistrictHeatmap
                    district="India"
                    points={mapPoints}
                    center={INDIA_CENTER}
                    zoom={5}
                    bounds={INDIA_BOUNDS}
                    outbreaks={outbreaks}
                    height="100%"
                  />
                </Suspense>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: '0 0 0.25rem' }}>Regional Data Insights</h1>
                  <p style={{ margin: 0, color: g.muted, fontSize: '0.9375rem' }}>Performance and severity breakdown aggregated by active districts.</p>
                </div>

                <div style={{ display: 'flex', background: g.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${g.cardBdr}`, gap: 4, backdropFilter: g.blur }}>
                  <button
                    onClick={() => setAnalyticsMode('cases')}
                    style={{
                      padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                      background: analyticsMode === 'cases' ? '#4f46e5' : 'transparent',
                      color: analyticsMode === 'cases' ? '#fff' : g.muted,
                      transition: 'all 0.2s'
                    }}
                  >Triage Cases</button>
                  <button
                    onClick={() => setAnalyticsMode('outbreaks')}
                    style={{
                      padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                      background: analyticsMode === 'outbreaks' ? '#4f46e5' : 'transparent',
                      color: analyticsMode === 'outbreaks' ? '#fff' : g.muted,
                      transition: 'all 0.2s'
                    }}
                  >Disease Outbreaks</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {analyticsMode === 'cases' ? regionStats.map(region => (
                  <div key={region.name} style={{ background: g.cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, backdropFilter: g.blur }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>{region.name}</h3>
                        <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>Last updated: {new Date(region.lastUpdate).toLocaleTimeString()}</div>
                      </div>
                      <div style={{ background: 'rgba(79,70,229,0.12)', color: '#4f46e5', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
                        {region.total} CASES
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { label: 'CRITICAL', value: region.critical, total: region.total, color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
                        { label: 'MODERATE', value: region.moderate, total: region.total, color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
                        { label: 'STABLE', value: region.stable, total: region.total, color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
                      ].map(({ label, value, total, color, bg }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: 6 }}>
                            <span style={{ color }}>{label}</span>
                            <span style={{ color: g.text }}>{value} ({Math.round((value / (total || 1)) * 100)}%)</span>
                          </div>
                          <div style={{ height: 6, background: bg, borderRadius: 10 }}>
                            <div style={{ width: `${(value / (total || 1)) * 100}%`, height: '100%', background: color, borderRadius: 10 }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${g.divider}`, display: 'flex', justifyContent: 'space-between' }}>
                      {[['Sickle Risk', region.sickle], ['App (Users)', region.app], ['IVR (Calls)', region.ivr]].map(([label, val]) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: g.text }}>{val}</div>
                          <div style={{ fontSize: '0.65rem', color: g.label, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : outbreakRegionStats.map(region => (
                  <div key={region.name} style={{ background: g.cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, backdropFilter: g.blur }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>{region.name}</h3>
                        <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>Status: Reported {region.lastUpdate}</div>
                      </div>
                      <div style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
                        {region.totalCases.toLocaleString()} REPORTS
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { label: 'TOTAL DEATHS', value: region.totalDeaths, color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
                        { label: 'DISEASE DIVERSITY', value: region.diseaseCount, color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)' },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: 6 }}>
                            <span style={{ color }}>{label}</span>
                            <span style={{ color: g.text }}>{value}</span>
                          </div>
                          <div style={{ height: 6, background: bg, borderRadius: 10 }}>
                            <div style={{ width: '100%', height: '100%', background: color, borderRadius: 10, opacity: 0.2 }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${g.divider}` }}>
                      <div style={{ fontSize: '0.65rem', color: g.label, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Top Conditions</div>
                      <div style={{ fontSize: '0.875rem', color: g.text, fontWeight: 600, fontStyle: 'italic' }}>
                        {region.topDiseases || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, overflow: 'hidden', boxShadow: g.cardShd, backdropFilter: g.blur }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}` }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>
                    {analyticsMode === 'cases' ? 'Comparative Region Performance' : 'District Outbreak Comparison'}
                  </h3>
                </div>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  {analyticsMode === 'cases' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: g.insetBg }}>
                        <tr>
                          {['District', 'Total Traffic', 'Alert Rate', 'Sickle indexed', 'Primary Source'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {regionStats.map(region => (
                          <tr key={region.name} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: g.text }}>{region.name}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.total}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ color: region.critical > 0 ? '#ef4444' : g.muted, fontWeight: 700 }}>
                                {Math.round((region.critical / (region.total || 1)) * 100)}%
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.sickle} cases</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ fontSize: '0.8125rem', padding: '4px 10px', borderRadius: 20, background: region.app >= region.ivr ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.12)', color: region.app >= region.ivr ? '#10b981' : '#7c3aed', fontWeight: 700 }}>
                                {region.app >= region.ivr ? 'MOBILE APP' : 'IVR HELPLINE'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: g.insetBg }}>
                        <tr>
                          {['District', 'Total Cases', 'Reported Deaths', 'Fatality Rate', 'Diseases Count'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outbreakRegionStats.map(region => (
                          <tr key={region.name} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: g.text }}>{region.name}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.totalCases.toLocaleString()}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#ef4444', fontWeight: 700 }}>{region.totalDeaths.toLocaleString()}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ color: g.text, fontWeight: 700 }}>
                                {((region.totalDeaths / (region.totalCases || 1)) * 100).toFixed(2)}%
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.diseaseCount} types</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}