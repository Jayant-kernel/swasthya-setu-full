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

// ── District Config ────────────────────────────────────────────────────────
const DISTRICT_CENTERS = {
  'Pune': [18.5204, 73.8567],
  'Mumbai': [19.0760, 72.8777],
  'Nagpur': [21.1458, 79.0882],
  'Nashik': [20.0059, 73.7897],
}
const DISTRICT_BOUNDS = {
  'Pune': [[17.85, 73.20], [19.20, 74.70]],
  'Mumbai': [[18.85, 72.70], [19.35, 73.10]],
  'Nagpur': [[20.60, 78.40], [21.70, 79.80]],
  'Nashik': [[19.40, 73.20], [20.60, 74.60]],
}

// Group records for heatmap visualization
function buildMapPoints(records, center) {
  if (!records.length) return []
  
  const withGps = records.filter(r => r.latitude && r.longitude)
  const withoutGps = records.filter(r => !r.latitude || !r.longitude)

  const gpsPoints = withGps.map(r => ({
    village: r.patient_name || 'Patient',
    total: 1,
    critical: r.severity === 'red' ? 1 : 0,
    moderate: r.severity === 'yellow' ? 1 : 0,
    mild: r.severity === 'green' ? 1 : 0,
    lastReported: new Date(r.created_at).toLocaleString('en-IN'),
    lat: r.latitude,
    lng: r.longitude
  }))

  const groups = {}
  withoutGps.forEach(r => {
    const village = r.patient_name || 'Unknown'
    if (!groups[village]) {
      groups[village] = { village, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
    }
    const g = groups[village]
    g.total++
    if (r.severity === 'red') g.critical++
    else if (r.severity === 'yellow') g.moderate++
    else g.mild++
    if (r.created_at > g.lastReported) g.lastReported = r.created_at
  })

  const legacyPoints = Object.values(groups).map((g, i) => {
    const angle = (i / (Object.keys(groups).length || 1)) * 2 * Math.PI
    const radius = 0.06 + (i % 4) * 0.08
    return {
      ...g,
      lat: center[0] + Math.sin(angle) * radius,
      lng: center[1] + Math.cos(angle) * radius,
      lastReported: new Date(g.lastReported).toLocaleString('en-IN'),
    }
  })

  return [...gpsPoints, ...legacyPoints]
}

// ── Icons ──────────────────────────────────────────────────────────────────
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const FileTextIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
const MapIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const ActivityIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>

// ── Components ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6' }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#10b981', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
        Active
      </div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{subtext}</div>
  </div>
)

const PatientOverviewChart = () => (
  <div style={{ padding: '1.5rem', background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', flex: 2 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Patients Overview</h3>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Medical patients</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd' }} /> Appointed patients</span>
      </div>
    </div>
    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem' }}>
      {[30, 45, 25, 60, 85, 70, 50, 65].map((h, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: '100%', width: '10%' }}>
          <div style={{ width: 12, height: `${h}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0' }} />
          <div style={{ width: 12, height: `${h * 0.7}%`, background: '#93c5fd', borderRadius: '4px 4px 0 0' }} />
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => <span key={m}>{m}</span>)}
    </div>
  </div>
)

const CalendarWidget = ({ selectedDate, setSelectedDate }) => {
  const currentMonth = "June 2026";
  return (
    <div style={{ padding: '1.5rem', background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Calendar</h3>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{currentMonth}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ fontWeight: 800 }}>{d}</div>)}
        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1;
          const isSelected = selectedDate === day;
          return (
            <div 
              key={i} 
              onClick={() => setSelectedDate(day)}
              style={{ 
                padding: '6px 0', borderRadius: 8, 
                background: isSelected ? '#3b82f6' : 'transparent',
                color: isSelected ? '#fff' : '#475569',
                fontWeight: isSelected ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('home') // home | map

  const _savedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const dmoDistrict = _savedUser.district || 'Pune'
  const center = DISTRICT_CENTERS[dmoDistrict] || [18.5204, 73.8567]
  const bounds = DISTRICT_BOUNDS[dmoDistrict] || null

  const [triageRecords, setTriageRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(9) // Default select 9th as per original UI
  const [sortConfig, setSortConfig] = useState({ key: 'patient_name', direction: 'asc' })

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, patRes] = await Promise.all([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/patients/`, { headers }),
      ])
      setTriageRecords((await triRes.json()) || [])
      setPatients((await patRes.json()) || [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statsCount = useMemo(() => {
    const unreviewed = triageRecords.filter(r => !r.reviewed).length
    const critical = triageRecords.filter(r => r.severity === 'red').length
    const sickle = triageRecords.filter(r => r.sickle_cell_risk).length
    return { unreviewed, critical, sickle }
  }, [triageRecords])

  const mapPoints = useMemo(() => buildMapPoints(triageRecords, center), [triageRecords, center])

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedAndFilteredRecords = useMemo(() => {
    let items = [...triageRecords];
    
    // Calendar filtering: Only show records for the selected date in June 2026
    if (selectedDate) {
      items = items.filter(r => {
        const d = new Date(r.created_at);
        // Assuming the mockup data or real data falls in June 2026 for this demonstration
        return d.getDate() === selectedDate && d.getMonth() === 5 && d.getFullYear() === 2026;
      });
    }
    
    // Sorting logic
    items.sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [triageRecords, sortConfig, selectedDate])

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .nav-link:hover { background: #f1f5f9; color: #3b82f6; }
        .nav-link.active { background: #ebf5ff; color: #3b82f6; font-weight: 700; border-left: 3px solid #3b82f6; }
        .btn-primary { background: #3b82f6; color: #fff; border: none; padding: 0.5rem 1rem; borderRadius: 8px; fontWeight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
        .table-row:hover { background: #f9fafb; cursor: pointer; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <img src={logo} alt="Logo" style={{ width: 42, height: 42 }} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', letterSpacing: '-0.03em' }}>Swasthya Setu</span>
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <div onClick={() => setActiveView('home')} className={`nav-link ${activeView === 'home' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 4 }}>
            <HomeIcon /> <span>Home</span>
          </div>
          <div onClick={() => setActiveView('map')} className={`nav-link ${activeView === 'map' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#64748b', cursor: 'pointer', marginBottom: 4 }}>
            <MapIcon /> <span>Districts Map</span>
          </div>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <div onClick={() => navigate('/dashboard/admin')} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#6366f1', cursor: 'pointer', marginBottom: 8, border: '1px dashed #e0e7ff', background: '#f5f7ff' }}>
            <span style={{ fontSize: '1.1rem' }}>🌐</span> <span>Admin Mode</span>
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
          <div style={{ position: 'relative', width: 360 }}>
             <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><SearchIcon /></span>
             <input type="text" placeholder="Search for patients or reports..." style={{ width: '100%', height: 44, padding: '0 1rem 0 3rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, outline: 'none', fontSize: '0.875rem' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><BellIcon /></button>
            <div style={{ height: 28, width: 1, background: '#e2e8f0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                {(_savedUser.full_name || 'D')[0]}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{_savedUser.full_name || 'DMO'}</div>
            </div>
          </div>
        </header>

        {/* Scrollable View */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          
          {activeView === 'home' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem' }}>DMO Overview — {dmoDistrict}</h1>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>Monitor real-time triage updates and patient distributions.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Buttons removed as per request */}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <StatCard label="Total Patients" value={patients.length} subtext="Registered in district" icon={UsersIcon} color="#3b82f6" />
                <StatCard label="Unreviewed" value={statsCount.unreviewed} subtext="Pending validation" icon={FileTextIcon} color="#f59e0b" />
                <StatCard label="Critical Alerts" value={statsCount.critical} subtext="Red severity cases" icon={ActivityIcon} color="#ef4444" />
                {/* Sickle Cell card removed as per request */}
              </div>

              {/* Charts Row */}
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <PatientOverviewChart />
                <CalendarWidget selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
              </div>

              {/* Patient Table section */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Recent Patient Triage</h3>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Filter and Add Record buttons removed as per request */}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        {[
                          { label: 'Patient Name', key: 'patient_name' },
                          { label: 'Identification No.', key: 'patient_id' },
                          { label: 'Location', key: 'district' },
                          { label: 'Status', key: 'reviewed' },
                          { label: 'Severity', key: 'severity' },
                          { label: 'Actions', key: null }
                        ].map(col => (
                          <th 
                            key={col.label} 
                            onClick={() => col.key && handleSort(col.key)}
                            style={{ 
                              textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, 
                              color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                              cursor: col.key ? 'pointer' : 'default',
                              userSelect: 'none'
                            }}
                          >
                            {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredRecords.slice(0, 8).map((record, i) => (
                        <tr key={record.id} className="table-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: i % 2 === 0 ? '#3b82f615' : '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i % 2 === 0 ? '#3b82f6' : '#10b981', fontWeight: 800, fontSize: '0.8125rem' }}>
                                {(record.patient_name || 'P')[0]}
                              </div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>{record.patient_name || 'John Doe'}</div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>ID-{record.patient_id?.substring(0,6) || record.id?.substring(0,6)}</td>
                          <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                            <div>{record.district || dmoDistrict}</div>
                            {record.latitude && record.longitude && (
                              <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>
                                📍 {Number(record.latitude).toFixed(5)}, {Number(record.longitude).toFixed(5)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                             <span style={{ 
                               padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                               background: record.reviewed ? '#dcfce7' : '#fef3c7',
                               color: record.reviewed ? '#10b981' : '#f59e0b'
                             }}>
                               {record.reviewed ? 'Checked' : 'Awaiting'}
                             </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                             <span style={{ 
                               fontSize: '0.875rem', fontWeight: 700,
                               color: record.severity === 'red' ? '#ef4444' : record.severity === 'yellow' ? '#f59e0b' : '#10b981'
                             }}>
                               {record.severity ? record.severity.toUpperCase() : 'STABLE'}
                             </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>⋮</button>
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
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>District Heatmap</h1>
                    <button onClick={() => setActiveView('home')} className="btn-primary" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>← Back Dashboard</button>
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', minHeight: 600 }}>
                    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading Region Map...</div>}>
                        <DistrictHeatmap district={dmoDistrict} points={mapPoints} center={center} bounds={bounds} />
                    </Suspense>
                </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
