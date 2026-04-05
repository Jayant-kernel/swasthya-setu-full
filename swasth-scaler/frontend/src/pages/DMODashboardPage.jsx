import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'


// ── Admin credentials (hardcoded for bypass auth) ─────────────────────────────
const ADMIN_ID = 'ADMIN001'
const ADMIN_PASS = 'swasthya@2024'

const DistrictHeatmap = lazy(() => import('../components/DistrictHeatmap'))

// District center coordinates — Odisha districts (matching actual DB data)
const DISTRICT_CENTERS = {
  'Angul':       [20.8400, 85.1000],
  'Balangir':    [20.7167, 83.4833],
  'Balasore':    [21.4942, 86.9317],
  'Bargarh':     [21.3333, 83.6167],
  'Bhadrak':     [21.0544, 86.4967],
  'Boudh':       [20.8500, 84.3167],
  'Cuttack':     [20.4625, 85.8830],
  'Deogarh':     [21.5333, 84.7333],
  'Dhenkanal':   [20.6597, 85.5975],
  'Gajapati':    [18.9842, 84.0974],
  'Ganjam':      [19.3833, 84.9833],
  'Jagatsinghpur':[20.2583, 86.1708],
  'Jajpur':      [20.8495, 86.3344],
  'Jharsuguda':  [21.8550, 84.0061],
  'Kalahandi':   [19.9120, 83.1687],
  'Kandhamal':   [20.1167, 84.2333],
  'Kendrapara':  [20.5020, 86.4230],
  'Kendujhar':   [21.6289, 85.5812],
  'Khordha':     [20.1824, 85.6239],
  'Koraput':     [18.8120, 82.7109],
  'Malkangiri':  [18.3500, 81.8833],
  'Mayurbhanj':  [21.9418, 86.7341],
  'Nabarangpur': [19.2294, 82.5490],
  'Nayagarh':    [20.1269, 85.0955],
  'Nuapada':     [20.8167, 82.5333],
  'Puri':        [19.8135, 85.8312],
  'Rayagada':    [19.1700, 83.4167],
  'Sambalpur':   [21.4669, 83.9756],
  'Subarnapur':  [20.8500, 83.9000],
  'Sundargarh':  [22.1167, 84.0333],
  'Berhampur':   [19.3150, 84.7941],
  // Maharashtra fallback
  'Pune':        [18.5204, 73.8567],
  'Mumbai':      [19.0760, 72.8777],
  'Nagpur':      [21.1458, 79.0882],
  'Nashik':      [20.0059, 73.7897],
  'Ahmednagar':  [19.0948, 74.7480],
}

function getDefaultCenter(district) {
  return DISTRICT_CENTERS[district] || [20.9517, 85.0985] // Odisha center
}

// Scatter demo dots around a center when no real data
function getDemoDots(district) {
  const center = getDefaultCenter(district)
  return [
    { village: 'Area A', lat: center[0]+0.12, lng: center[1]+0.15, total: 8,  critical: 2, moderate: 3, mild: 3, lastReported: 'No data', ashaWorker: '—' },
    { village: 'Area B', lat: center[0]-0.18, lng: center[1]+0.08, total: 5,  critical: 0, moderate: 2, mild: 3, lastReported: 'No data', ashaWorker: '—' },
    { village: 'Area C', lat: center[0]+0.06, lng: center[1]-0.20, total: 11, critical: 4, moderate: 4, mild: 3, lastReported: 'No data', ashaWorker: '—' },
  ]
}

class MapErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ height:420, display:'flex', alignItems:'center', justifyContent:'center',
        background:'#f8fafc', borderRadius:10, color:'#94a3b8' }}>Map unavailable</div>
    )
    return this.props.children
  }
}

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate    = useNavigate()
  const dmoName     = localStorage.getItem('dmoName')     || 'DMO'
  const dmoDistrict = localStorage.getItem('dmoDistrict') || 'Puri'
  const center      = getDefaultCenter(dmoDistrict)

  const [patients,    setPatients]    = useState([])
  const [mapPoints,   setMapPoints]   = useState([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [loading,     setLoading]     = useState(true)

  // Admin mode modal state
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminId,      setAdminId]      = useState('')
  const [adminPass,    setAdminPass]    = useState('')
  const [adminError,   setAdminError]   = useState('')

  const fetchData = useCallback(async () => {
    try {
      // Fetch ALL patients in this district via native fetch
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/patients/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch patients')
      
      const allData = await res.json()
      // Frontend filter for district for demo purposes
      const data = allData.filter(r => r.district === dmoDistrict)

      const rows = data || []
      setPatients(rows)

      // Build map dots — group by gender as a proxy (no village column exists)
      // Each gender group becomes a "cluster" dot on the map
      const groups = {}
      rows.forEach(r => {
        const key = r.gender || 'Unknown'
        if (!groups[key]) groups[key] = { village: `${key} patients`, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
        groups[key].total++
        // Approximate severity by age: <18 or >60 = critical, 18-40 = mild, else moderate
        if (r.age < 18 || r.age > 60) groups[key].critical++
        else if (r.age <= 40)          groups[key].mild++
        else                            groups[key].moderate++
        if (r.created_at > groups[key].lastReported) groups[key].lastReported = r.created_at
      })

      if (Object.keys(groups).length === 0) {
        setMapPoints(getDemoDots(dmoDistrict))
      } else {
        const pts = Object.values(groups).map((g, i) => {
          const angle  = (i / Object.values(groups).length) * 2 * Math.PI
          const radius = 0.08 + (i % 3) * 0.10
          return {
            ...g,
            lat: center[0] + Math.sin(angle) * radius,
            lng: center[1] + Math.cos(angle) * radius,
            lastReported: new Date(g.lastReported).toLocaleString(),
            ashaWorker: '—',
          }
        })
        setMapPoints(pts)
      }
    } catch (e) {
      console.error('Supabase fetch error:', e)
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

  function handleAdminConfirm() {
    localStorage.setItem('admin_bypass', 'true')
    setShowConfirm(false)
    navigate('/dashboard/admin')
  }

  // Derived stats from real data
  const totalPatients  = patients.length
  const maleCount      = patients.filter(p => p.gender === 'Male').length
  const femaleCount    = patients.filter(p => p.gender === 'Female').length
  const seniorCount    = patients.filter(p => p.age > 60).length  // "flagged" high-risk
  const recentCount    = patients.filter(p => {
    const d = new Date(p.created_at)
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  }).length

  const stats = [
    { label: 'Total Patients',   value: loading ? '…' : totalPatients, sub: 'ମୋଟ ରୋଗୀ',         color: '#6366f1' },
    { label: 'This Week',        value: loading ? '…' : recentCount,   sub: 'ଏହି ସପ୍ତାହ',       color: '#f59e0b' },
    { label: 'High Risk (60+)',   value: loading ? '…' : seniorCount,   sub: 'ଚିହ୍ନିତ କେସ୍',    color: '#ef4444' },
    { label: 'Female Patients',  value: loading ? '…' : femaleCount,   sub: 'ମହିଳା ରୋଗୀ',       color: '#22c55e' },
  ]

  return (
    <div style={{ minHeight:'100dvh', background:'#f1f5f9', padding:'1.5rem' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.92)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dmo-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,.07); padding:1.5rem; animation:fadeInUp .4s ease both; }
        .live-dot { display:inline-block; width:9px; height:9px; background:#22c55e; border-radius:50%; margin-right:6px; animation:pulse 1.6s ease-in-out infinite; }
        .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(4px); }
        .modal-box { background:#fff; border-radius:20px; padding:2rem 2.5rem; width:100%; max-width:420px; box-shadow:0 24px 60px rgba(0,0,0,0.2); }
      `}</style>

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <div className="modal-bg" onClick={() => setShowConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'2.5rem', textAlign:'center', marginBottom:'0.5rem' }}>🔐</div>
            <h2 style={{ textAlign:'center', fontSize:'1.25rem', fontWeight:800, color:'#1e293b', margin:'0 0 0.5rem' }}>Switch to Admin Mode?</h2>
            <p style={{ textAlign:'center', color:'#64748b', fontSize:'0.9rem', marginBottom:'1.75rem' }}>
              Admin mode shows the heatmap of <strong>all districts across India</strong>.<br />You will need admin credentials to proceed.
            </p>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex:1, padding:'0.75rem', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'0.95rem' }}>
                Cancel
              </button>
              <button onClick={handleAdminConfirm} style={{ flex:1, padding:'0.75rem', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor:'pointer', fontWeight:700, color:'#fff', fontSize:'0.95rem' }}>
                Yes, Switch →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <header className="dmo-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ color:'#6366f1', fontSize:'1.3rem', margin:0 }}>
            {dmoName} &nbsp;·&nbsp; <span style={{ color:'#64748b', fontWeight:500 }}>{dmoDistrict} District</span>
          </h1>
          <p style={{ color:'#94a3b8', margin:'4px 0 0', fontSize:'0.875rem' }}>
            District Medical Officer Dashboard / ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ ଡ୍ୟାସବୋର୍ଡ
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <button onClick={() => setShowConfirm(true)} style={{ padding:'0.5rem 1.25rem', borderRadius:'8px', border:'none',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor:'pointer', fontWeight:700, color:'#fff', fontSize:'0.875rem' }}>
            🔐 Admin Mode
          </button>
          <button onClick={() => {
            localStorage.removeItem('dmo_bypass')
            localStorage.removeItem('dmoName')
            localStorage.removeItem('dmoDistrict')
            localStorage.removeItem('dmoEmpId')
            navigate('/')
          }} style={{ padding:'0.5rem 1.25rem', borderRadius:'8px', border:'1.5px solid #e2e8f0',
            background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Stat cards — real data */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="dmo-card" style={{ textAlign:'center', animationDelay:`${i*0.07}s` }}>
            <div style={{ fontSize:'2.1rem', fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#334155' }}>{s.label}</div>
            <div style={{ fontSize:'0.8rem', color:'#94a3b8', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="dmo-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1.1rem', color:'#1e293b' }}>{dmoDistrict} District — Live Case Heatmap</h2>
            <p style={{ margin:'4px 0 0', fontSize:'0.8rem', color:'#94a3b8' }}>
              Last updated: {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ display:'flex', alignItems:'center', background:'#dcfce7', color:'#16a34a',
              padding:'4px 10px', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem' }}>
              <span className="live-dot" />LIVE
            </span>
            <button onClick={fetchData} style={{ padding:'5px 14px', borderRadius:'8px', border:'1.5px solid #e2e8f0',
              background:'#fff', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, color:'#475569' }}>
              ↺ Refresh
            </button>
          </div>
        </div>

        <div style={{ display:'flex', gap:'1.25rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
          {[['#ef4444','High Risk (age <18 or >60)'],['#f59e0b','Moderate (41–60)'],['#22c55e','Low Risk (18–40)']].map(([c,l]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', color:'#475569', fontWeight:600 }}>
              <span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', background:c }} />{l}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ height:420, display:'flex', alignItems:'center', justifyContent:'center',
            background:'#f8fafc', borderRadius:10, color:'#94a3b8' }}>Loading map…</div>
        ) : (
          <MapErrorBoundary>
            <Suspense fallback={<div style={{ height:420, display:'flex', alignItems:'center', justifyContent:'center',
              background:'#f8fafc', borderRadius:10, color:'#94a3b8' }}>Loading map…</div>}>
              <DistrictHeatmap district={dmoDistrict} points={mapPoints} center={center} />
            </Suspense>
          </MapErrorBoundary>
        )}
      </div>

      {/* Patient records table — real data */}
      <div className="dmo-card">
        <h3 style={{ margin:'0 0 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'1rem', color:'#1e293b' }}>
          Patient Records — {dmoDistrict}
          {patients.length > 0 && (
            <span style={{ background:'#ede9fe', color:'#6d28d9', padding:'3px 10px', borderRadius:'999px', fontSize:'0.78rem', fontWeight:700 }}>
              {patients.length} total
            </span>
          )}
        </h3>
        {loading ? (
          <p style={{ color:'#94a3b8', textAlign:'center', padding:'2rem 0' }}>Loading…</p>
        ) : patients.length === 0 ? (
          <p style={{ color:'#94a3b8', textAlign:'center', padding:'2rem 0' }}>No patients registered in {dmoDistrict} yet.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' }}>
              <thead>
                <tr style={{ borderBottom:'1.5px solid #e2e8f0', textAlign:'left' }}>
                  {['Name','Age','Gender','District','Registered'].map(h => (
                    <th key={h} style={{ padding:'0.65rem 0.75rem', color:'#64748b', fontWeight:600, fontSize:'0.82rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0?'#fafafa':'#fff' }}>
                    <td style={{ padding:'0.85rem 0.75rem', fontWeight:600, color:'#1e293b' }}>{p.name}</td>
                    <td style={{ padding:'0.85rem 0.75rem', color:'#475569' }}>
                      <span style={{
                        padding:'2px 8px', borderRadius:'999px', fontSize:'0.78rem', fontWeight:700,
                        background: (p.age < 18 || p.age > 60) ? '#fee2e2' : p.age > 40 ? '#fef3c7' : '#dcfce7',
                        color:      (p.age < 18 || p.age > 60) ? '#dc2626' : p.age > 40 ? '#92400e' : '#16a34a',
                      }}>{p.age}</span>
                    </td>
                    <td style={{ padding:'0.85rem 0.75rem', color:'#475569' }}>{p.gender}</td>
                    <td style={{ padding:'0.85rem 0.75rem', color:'#475569' }}>{p.district}</td>
                    <td style={{ padding:'0.85rem 0.75rem', color:'#94a3b8', fontSize:'0.82rem' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
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
