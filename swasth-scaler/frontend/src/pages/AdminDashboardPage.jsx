import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'


const DistrictHeatmap = lazy(() => import('../components/DistrictHeatmap'))

// All district centers — Odisha + Maharashtra (expandable)
const DISTRICT_CENTERS = {
  // Odisha
  'Angul':         [20.8400, 85.1000],
  'Balangir':      [20.7167, 83.4833],
  'Balasore':      [21.4942, 86.9317],
  'Bargarh':       [21.3333, 83.6167],
  'Bhadrak':       [21.0544, 86.4967],
  'Boudh':         [20.8500, 84.3167],
  'Cuttack':       [20.4625, 85.8830],
  'Deogarh':       [21.5333, 84.7333],
  'Dhenkanal':     [20.6597, 85.5975],
  'Gajapati':      [18.9842, 84.0974],
  'Ganjam':        [19.3833, 84.9833],
  'Jagatsinghpur': [20.2583, 86.1708],
  'Jajpur':        [20.8495, 86.3344],
  'Jharsuguda':    [21.8550, 84.0061],
  'Kalahandi':     [19.9120, 83.1687],
  'Kandhamal':     [20.1167, 84.2333],
  'Kendrapara':    [20.5020, 86.4230],
  'Kendujhar':     [21.6289, 85.5812],
  'Khordha':       [20.1824, 85.6239],
  'Koraput':       [18.8120, 82.7109],
  'Malkangiri':    [18.3500, 81.8833],
  'Mayurbhanj':    [21.9418, 86.7341],
  'Nabarangpur':   [19.2294, 82.5490],
  'Nayagarh':      [20.1269, 85.0955],
  'Nuapada':       [20.8167, 82.5333],
  'Puri':          [19.8135, 85.8312],
  'Rayagada':      [19.1700, 83.4167],
  'Sambalpur':     [21.4669, 83.9756],
  'Subarnapur':    [20.8500, 83.9000],
  'Sundargarh':    [22.1167, 84.0333],
  'Berhampur':     [19.3150, 84.7941],
  // Maharashtra
  'Mumbai':        [19.0760, 72.8777],
  'Pune':          [18.5204, 73.8567],
  'Nagpur':        [21.1458, 79.0882],
  'Nashik':        [20.0059, 73.7897],
  'Aurangabad':    [19.8762, 75.3433],
  'Solapur':       [17.6805, 75.9064],
  'Amravati':      [20.9320, 77.7523],
  'Kolhapur':      [16.7050, 74.2433],
  'Satara':        [17.6805, 74.0183],
  'Ahmednagar':    [19.0948, 74.7480],
  'Thane':         [19.2183, 72.9781],
  'Jalgaon':       [21.0077, 75.5626],
  'Latur':         [18.4088, 76.5604],
  'Dhule':         [20.9042, 74.7749],
  'Chandrapur':    [19.9615, 79.2961],
  'Yavatmal':      [20.3888, 78.1204],
  'Raigad':        [18.5158, 73.1298],
  'Osmanabad':     [18.1860, 76.0391],
  'Beed':          [18.9890, 75.7601],
  'Nanded':        [19.1383, 77.3210],
  'Wardha':        [20.7453, 78.6022],
  'Buldhana':      [20.5292, 76.1842],
  'Sangli':        [16.8524, 74.5815],
}

// India center for wide view
const INDIA_CENTER = [22.5, 82.5]

class MapErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ height:520, display:'flex', alignItems:'center', justifyContent:'center',
        background:'#f8fafc', borderRadius:10, color:'#94a3b8' }}>Map unavailable</div>
    )
    return this.props.children
  }
}

// Admin heatmap — India zoom, all districts
function IndiaHeatmap({ points }) {
  return (
    <Suspense fallback={<div style={{ height:520, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:10, color:'#94a3b8' }}>Loading map…</div>}>
      <DistrictHeatmap district="India" points={points} center={INDIA_CENTER} zoom={5} />
    </Suspense>
  )
}

const API = 'https://swasthya-setu-full.onrender.com/api/v1'
const SEV_COLOR = { red: '#f87171', yellow: '#fbbf24', green: '#34d399' }
const SEV_BG    = { red: 'rgba(239,68,68,0.2)', yellow: 'rgba(245,158,11,0.2)', green: 'rgba(34,197,94,0.2)' }
const SEV_LABEL = { red: 'Emergency', yellow: 'Moderate', green: 'Mild' }

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [triageRecords, setTriageRecords] = useState([])
  const [mapPoints,     setMapPoints]     = useState([])
  const [lastRefresh,   setLastRefresh]   = useState(new Date())
  const [loading,       setLoading]       = useState(true)
  const [districtFilter, setDistrictFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('all')

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Triage records are NOT district-filtered for DMO/admin — gives us all data
      const res = await fetch(`${API}/triage_records/`, { headers })
      if (!res.ok) throw new Error('Failed to fetch triage records')
      const rows = (await res.json()) || []
      setTriageRecords(rows)

      // Group by district → one dot per district on the map
      const groups = {}
      rows.forEach(r => {
        const d = r.district || 'Unknown'
        if (!groups[d]) groups[d] = { village: d, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at, ashaWorker: '—' }
        groups[d].total++
        if (r.severity === 'red')         groups[d].critical++
        else if (r.severity === 'yellow') groups[d].moderate++
        else                              groups[d].mild++
        if (r.created_at > groups[d].lastReported) groups[d].lastReported = r.created_at
      })

      const pts = Object.entries(groups).map(([district, g]) => {
        const coords = DISTRICT_CENTERS[district]
        if (!coords) return null
        return { ...g, lat: coords[0], lng: coords[1], lastReported: new Date(g.lastReported).toLocaleString() }
      }).filter(Boolean)

      setMapPoints(pts)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 30000)
    return () => clearInterval(id)
  }, [fetchAll])

  function handleLogout() {
    localStorage.removeItem('admin_bypass')
    navigate('/dashboard/dmo')
  }

  const districts   = [...new Set(triageRecords.map(r => r.district).filter(Boolean))].sort()
  const redCount    = triageRecords.filter(r => r.severity === 'red').length
  const yellowCount = triageRecords.filter(r => r.severity === 'yellow').length
  const greenCount  = triageRecords.filter(r => r.severity === 'green').length
  const sickleCount = triageRecords.filter(r => r.sickle_cell_risk).length
  const thisWeek    = triageRecords.filter(r => (Date.now() - new Date(r.created_at)) < 7*24*60*60*1000).length
  const filtered    = triageRecords
    .filter(r => districtFilter === 'All' || r.district === districtFilter)
    .filter(r => severityFilter === 'all'  || r.severity === severityFilter)

  return (
    <div style={{ minHeight:'100dvh', background:'#0f172a', padding:'1.5rem' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.92)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .admin-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:1.5rem; animation:fadeInUp .4s ease both; backdrop-filter:blur(8px); }
        .live-dot { display:inline-block; width:9px; height:9px; background:#22c55e; border-radius:50%; margin-right:6px; animation:pulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="admin-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem' }}>
            <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'3px 12px', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.08em' }}>ADMIN MODE</span>
            <h1 style={{ color:'#f1f5f9', fontSize:'1.3rem', margin:0 }}>National Health Overview</h1>
          </div>
          <p style={{ color:'#64748b', margin:0, fontSize:'0.875rem' }}>All districts · Real-time patient data · Swasthya Setu</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={fetchAll} style={{ padding:'0.5rem 1.25rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.15)',
            background:'transparent', cursor:'pointer', fontWeight:600, color:'#94a3b8', fontSize:'0.875rem' }}>
            ↺ Refresh
          </button>
          <button onClick={handleLogout} style={{ padding:'0.5rem 1.25rem', borderRadius:'8px', border:'none',
            background:'#ef4444', cursor:'pointer', fontWeight:700, color:'#fff', fontSize:'0.875rem' }}>
            ← Back to DMO
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total Records',    value: triageRecords.length, color:'#818cf8' },
          { label:'Districts Active', value: districts.length,     color:'#34d399' },
          { label:'Emergency (RED)',  value: redCount,             color:'#f87171' },
          { label:'Moderate (YLW)',   value: yellowCount,          color:'#fbbf24' },
          { label:'Mild (GREEN)',     value: greenCount,           color:'#34d399' },
          { label:'Sickle Cell Risk', value: sickleCount,          color:'#a78bfa' },
          { label:'This Week',        value: thisWeek,             color:'#38bdf8' },
        ].map((s, i) => (
          <div key={s.label} className="admin-card" style={{ textAlign:'center', animationDelay:`${i*0.05}s` }}>
            <div style={{ fontSize:'2rem', fontWeight:800, color:s.color }}>{loading ? '…' : s.value}</div>
            <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#cbd5e1' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* India heatmap */}
      <div className="admin-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', color:'#f1f5f9' }}>All-India Patient Heatmap</h2>
            <p style={{ margin:'4px 0 0', fontSize:'0.8rem', color:'#64748b' }}>
              One dot per district · Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          </div>
          <span style={{ display:'flex', alignItems:'center', background:'rgba(34,197,94,0.15)', color:'#22c55e',
            padding:'4px 10px', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem', border:'1px solid rgba(34,197,94,0.3)' }}>
            <span className="live-dot" />LIVE
          </span>
        </div>

        <div style={{ display:'flex', gap:'1.25rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
          {[['#ef4444','RED — Emergency'],['#f59e0b','YELLOW — Moderate'],['#22c55e','GREEN — Mild']].map(([c,l]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'#94a3b8', fontWeight:600 }}>
              <span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:c }} />{l}
            </span>
          ))}
          <span style={{ fontSize:'0.82rem', color:'#475569', marginLeft:'auto' }}>Dot size = case count · Click for details</span>
        </div>

        {loading ? (
          <div style={{ height:520, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(255,255,255,0.03)', borderRadius:10, color:'#475569' }}>Loading map…</div>
        ) : (
          <MapErrorBoundary>
            <IndiaHeatmap points={mapPoints} />
          </MapErrorBoundary>
        )}
      </div>

      {/* Filters + triage records table */}
      <div className="admin-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <h3 style={{ margin:0, fontSize:'1rem', color:'#f1f5f9' }}>
            Triage Records
            {!loading && (
              <span style={{ marginLeft:10, background:'rgba(99,102,241,0.2)', color:'#818cf8',
                padding:'2px 10px', borderRadius:'999px', fontSize:'0.76rem', fontWeight:700 }}>
                {filtered.length} shown / {triageRecords.length} total
              </span>
            )}
          </h3>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
              style={{ padding:'0.45rem 0.9rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.15)',
                background:'#1e293b', color:'#cbd5e1', fontSize:'0.82rem', cursor:'pointer' }}>
              <option value="All">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              style={{ padding:'0.45rem 0.9rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.15)',
                background:'#1e293b', color:'#cbd5e1', fontSize:'0.82rem', cursor:'pointer' }}>
              <option value="all">All Severities</option>
              <option value="red">Emergency (RED)</option>
              <option value="yellow">Moderate (YELLOW)</option>
              <option value="green">Mild (GREEN)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color:'#475569', textAlign:'center', padding:'2rem 0' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color:'#475569', textAlign:'center', padding:'2rem 0' }}>No records found.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)', textAlign:'left' }}>
                  {['Patient','Symptoms','Severity','Sickle Cell','District','Date'].map(h => (
                    <th key={h} style={{ padding:'0.65rem 0.75rem', color:'#64748b', fontWeight:600, fontSize:'0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding:'0.75rem', fontWeight:600, color:'#e2e8f0' }}>
                      {r.patient_name || '—'}
                      <div style={{ fontSize:'0.72rem', color:'#475569', fontWeight:400 }}>
                        {r.source === 'helpline_call' ? '📞 Helpline' : '📱 App'}
                      </div>
                    </td>
                    <td style={{ padding:'0.75rem', maxWidth:180 }}>
                      {Array.isArray(r.symptoms) && r.symptoms.length > 0 ? (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                          {r.symptoms.slice(0,3).map(s => (
                            <span key={s} style={{ background:'rgba(255,255,255,0.07)', color:'#94a3b8',
                              padding:'1px 7px', borderRadius:'999px', fontSize:'0.7rem' }}>{s}</span>
                          ))}
                          {r.symptoms.length > 3 && <span style={{ color:'#475569', fontSize:'0.7rem' }}>+{r.symptoms.length-3}</span>}
                        </div>
                      ) : (
                        <span style={{ color:'#475569', fontSize:'0.78rem' }}>{r.brief || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding:'0.75rem' }}>
                      <span style={{ padding:'3px 10px', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700,
                        background: SEV_BG[r.severity]    || 'rgba(255,255,255,0.07)',
                        color:      SEV_COLOR[r.severity] || '#94a3b8' }}>
                        {SEV_LABEL[r.severity] || r.severity || '—'}
                      </span>
                    </td>
                    <td style={{ padding:'0.75rem' }}>
                      {r.sickle_cell_risk
                        ? <span style={{ background:'rgba(167,139,250,0.2)', color:'#a78bfa', padding:'2px 9px', borderRadius:'999px', fontSize:'0.73rem', fontWeight:700 }}>YES</span>
                        : <span style={{ color:'#334155' }}>—</span>}
                    </td>
                    <td style={{ padding:'0.75rem', color:'#64748b' }}>{r.district || '—'}</td>
                    <td style={{ padding:'0.75rem', color:'#475569', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
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
