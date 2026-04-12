import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../images/logo/logo.png'

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
  'Angul':         [20.8400, 85.1000], 'Balangir':      [20.7167, 83.4833],
  'Balasore':      [21.4942, 86.9317], 'Bargarh':       [21.3333, 83.6167],
  'Bhadrak':       [21.0544, 86.4967], 'Boudh':         [20.8500, 84.3167],
  'Cuttack':       [20.4625, 85.8830], 'Deogarh':       [21.5333, 84.7333],
  'Dhenkanal':     [20.6597, 85.5975], 'Gajapati':      [18.9842, 84.0974],
  'Ganjam':        [19.3833, 84.9833], 'Jagatsinghpur': [20.2583, 86.1708],
  'Jajpur':        [20.8495, 86.3344], 'Jharsuguda':    [21.8550, 84.0061],
  'Kalahandi':     [19.9120, 83.1687], 'Kandhamal':     [20.1167, 84.2333],
  'Kendrapara':    [20.5020, 86.4230], 'Kendujhar':     [21.6289, 85.5812],
  'Khordha':       [20.1824, 85.6239], 'Koraput':       [18.8120, 82.7109],
  'Malkangiri':    [18.3500, 81.8833], 'Mayurbhanj':    [21.9418, 86.7341],
  'Nabarangpur':   [19.2294, 82.5490], 'Nayagarh':      [20.1269, 85.0955],
  'Nuapada':       [20.8167, 82.5333], 'Puri':          [19.8135, 85.8312],
  'Rayagada':      [19.1700, 83.4167], 'Sambalpur':     [21.4669, 83.9756],
  'Subarnapur':    [20.8500, 83.9000], 'Sundargarh':    [22.1167, 84.0333],
  'Berhampur':     [19.3150, 84.7941],
  // Maharashtra
  'Mumbai':        [19.0760, 72.8777], 'Pune':          [18.5204, 73.8567],
  'Nagpur':        [21.1458, 79.0882], 'Nashik':        [20.0059, 73.7897],
  'Aurangabad':    [19.8762, 75.3433], 'Solapur':       [17.6805, 75.9064],
  'Amravati':      [20.9320, 77.7523], 'Kolhapur':      [16.7050, 74.2433],
  'Satara':        [17.6805, 74.0183], 'Ahmednagar':    [19.0948, 74.7480],
  'Thane':         [19.2183, 72.9781], 'Jalgaon':       [21.0077, 75.5626],
  'Latur':         [18.4088, 76.5604], 'Dhule':         [20.9042, 74.7749],
  'Chandrapur':    [19.9615, 79.2961], 'Yavatmal':      [20.3888, 78.1204],
}
const INDIA_CENTER = [22.5, 82.5]

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const MapIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const GlobeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const ActivityIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>

// ── Components ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6' }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>
        NATIONAL
      </div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{subtext}</div>
  </div>
)

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('home')
  const [triageRecords, setTriageRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const _savedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await fetch(`${API}/triage_records/`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      const rows = await res.json()
      setTriageRecords(rows || [])
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

  const mapPoints = useMemo(() => {
    const withGps = triageRecords.filter(r => r.latitude && r.longitude);
    const withoutGps = triageRecords.filter(r => !r.latitude || !r.longitude);

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
    }));

    const groups = {};
    withoutGps.forEach(r => {
      const d = r.district || 'Unknown';
      if (!groups[d]) groups[d] = { village: d, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at };
      groups[d].total++;
      if (r.severity === 'red') groups[d].critical++;
      else if (r.severity === 'yellow') groups[d].moderate++;
      else groups[d].mild++;
      if (r.created_at > groups[d].lastReported) groups[d].lastReported = r.created_at;
    });

    const legacyPoints = Object.entries(groups).map(([district, g]) => {
      const coords = DISTRICT_CENTERS[district];
      if (!coords) return null;
      return { 
        ...g, 
        lat: coords[0], 
        lng: coords[1], 
        lastReported: new Date(g.lastReported).toLocaleString('en-IN') 
      };
    }).filter(Boolean);

    return [...gpsPoints, ...legacyPoints];
  }, [triageRecords])

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .nav-link:hover { background: #f1f5f9; color: #4f46e5; }
        .nav-link.active { background: #eef2ff; color: #4f46e5; font-weight: 700; border-left: 3px solid #4f46e5; }
        .btn-primary { background: #4f46e5; color: #fff; border: none; padding: 0.5rem 1.25rem; borderRadius: 8px; fontWeight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
        .table-row:hover { background: #f9fafb; cursor: pointer; }
        .live-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); } }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <img src={logo} alt="Logo" style={{ width: 42, height: 42 }} />
          <div>
             <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1 }}>Swasthya Setu</div>
             <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4, letterSpacing: '0.05em' }}>ADMIN PORTAL</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <div onClick={() => setActiveView('home')} className={`nav-link ${activeView === 'home' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 4 }}>
            <HomeIcon /> <span>Overview</span>
          </div>
          <div onClick={() => setActiveView('map')} className={`nav-link ${activeView === 'map' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 4 }}>
            <MapIcon /> <span>National Map</span>
          </div>
          <div className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 4 }}>
            <GlobeIcon /> <span>Region Analytics</span>
          </div>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
           <div onClick={() => navigate('/dashboard/dmo')} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 8, border: '1px dashed #e2e8f0' }}>
            <span>← District View</span>
          </div>
          <div onClick={() => { logout(); navigate('/') }} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer' }}>
            <LogoutIcon /> <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        
        {/* Top Navbar */}
        <header style={{ height: 72, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span className="live-pulse" />
             <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10b981' }}>LIVE NATIONAL MONITORING</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>Administrator</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>System Control Center</div>
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
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem' }}>National Health Command</h1>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>Aggregated data from all active districts and PHCs.</p>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>
                    Last Sync: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <StatCard label="Total Triage Instances" value={stats.total} subtext="Records across all states" icon={ActivityIcon} color="#4f46e5" />
                <StatCard label="Active Districts" value={stats.districts} subtext="Reporting real-time data" icon={GlobeIcon} color="#34d399" />
                <StatCard label="National Alerts (RED)" value={stats.critical} subtext="High-severity escalations" icon={ActivityIcon} color="#ef4444" />
                <StatCard label="Sickle Cell Index" value={stats.sickle} subtext="Identified high-risk cases" icon={UsersIcon} color="#8b5cf6" />
              </div>

              {/* Patient Table section */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Recent Global Triage Events</h3>
                  <button onClick={fetchData} className="btn-primary" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8125rem' }}>Refresh</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        {['Patient', 'District', 'Source', 'Severity', 'Risk Factor', 'Date'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {triageRecords.slice(0, 15).map((record, i) => (
                        <tr key={record.id} className="table-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{record.patient_name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {record.id?.substring(0,8)}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontSize: '0.875rem', fontWeight: 600 }}>{record.district || 'General'}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                             <span style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {record.source === 'helpline_call' ? '📞 IVR' : '📱 App'}
                             </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                             <span style={{ 
                               fontSize: '0.875rem', fontWeight: 700,
                               color: record.severity === 'red' ? '#ef4444' : record.severity === 'yellow' ? '#f59e0b' : '#10b981'
                             }}>
                               {record.severity ? record.severity.toUpperCase() : 'STABLE'}
                             </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            {record.sickle_cell_risk ? (
                                <span style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800 }}>SICKLE RISK</span>
                            ) : <span style={{ color: '#e2e8f0' }}>—</span>}
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
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
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>National Health Heatmap</h1>
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', minHeight: 600 }}>
                    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading National Map...</div>}>
                        <DistrictHeatmap district="India" points={mapPoints} center={INDIA_CENTER} zoom={5} />
                    </Suspense>
                </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
