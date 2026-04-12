import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext.jsx'

const API = 'https://swasthya-setu-full.onrender.com/api/v1'

// ── District Config ────────────────────────────────────────────────────────
export const DISTRICT_CENTERS = {
  'Pune': [18.5204, 73.8567],
  'Mumbai': [19.0760, 72.8777],
  'Nagpur': [21.1458, 79.0882],
  'Nashik': [20.0059, 73.7897],
  'Aurangabad': [19.8762, 75.3433],
  'Solapur': [17.6805, 75.9064],
  'Amravati': [20.9320, 77.7523],
  'Kolhapur': [16.7050, 74.2433],
  'Satara': [17.6805, 74.0183],
  'Ahmednagar': [19.0948, 74.7480],
  'Thane': [19.2183, 72.9781],
}
export const DISTRICT_BOUNDS = {
  'Pune': [[17.85, 73.20], [19.20, 74.70]],
  'Mumbai': [[18.85, 72.70], [19.35, 73.10]],
  'Nagpur': [[20.60, 78.40], [21.70, 79.80]],
  'Nashik': [[19.40, 73.20], [20.60, 74.60]],
  'Aurangabad': [[19.40, 74.80], [20.40, 75.90]],
  'Solapur': [[17.10, 75.40], [18.20, 76.50]],
  'Kolhapur': [[16.20, 73.80], [17.20, 74.70]],
  'Thane': [[18.90, 72.70], [19.60, 73.50]],
}

export function buildMapPoints(records, center) {
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
const MapIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const ActivityIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6', g }) => (
  <div style={{ background: g.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: g.cardShd, border: `1px solid ${g.cardBdr}`, flex: 1, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.14)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>Active</div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: g.text }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>{subtext}</div>
  </div>
)

const PatientOverviewChart = ({ g }) => (
  <div style={{ padding: '1.5rem', background: g.cardBg, borderRadius: 16, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, flex: 2, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: g.text }}>Patients Overview</h3>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600, color: g.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Medical</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd' }} /> Appointed</span>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', color: g.label, fontSize: '0.75rem' }}>
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => <span key={m}>{m}</span>)}
    </div>
  </div>
)

const CalendarWidget = ({ selectedDate, setSelectedDate, g }) => (
  <div style={{ padding: '1.5rem', background: g.cardBg, borderRadius: 16, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, flex: 1, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: g.text }}>Calendar</h3>
      <span style={{ fontSize: '0.75rem', color: g.muted, fontWeight: 700 }}>April 2026</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, fontSize: '0.7rem', color: g.label, textAlign: 'center' }}>
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{ fontWeight: 800 }}>{d}</div>)}
      {Array.from({ length: 30 }).map((_, i) => {
        const day = i + 1
        const isSelected = selectedDate === day
        return (
          <div key={i} onClick={() => setSelectedDate(day)}
            style={{ padding: '6px 0', borderRadius: 8, background: isSelected ? '#3b82f6' : 'transparent', color: isSelected ? '#fff' : g.text, fontWeight: isSelected ? 800 : 500, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
          >{day}</div>
        )
      })}
    </div>
    <button onClick={() => setSelectedDate(null)}
      style={{ marginTop: '1.25rem', width: '100%', padding: '0.625rem', borderRadius: 10, border: `1px solid ${g.divider}`, background: g.insetBg, color: g.muted, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
      Reset Calendar
    </button>
  </div>
)

// ── Sidebar (shared) ───────────────────────────────────────────────────────
export function DMOSidebar({ isHovered, setIsHovered, savedUser, onLogout, onAdminNav }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { isDark } = useTheme()

  const isHome = currentPath === '/dashboard/dmo'
  const isMap = currentPath.includes('/map')

  const g = useMemo(() => ({
    cardBg: 'var(--g-card-bg)',
    divider: 'var(--g-divider)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    accent: 'var(--g-accent)',
    blur: 'var(--g-blur)',
  }), [isDark])

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: isHovered ? 240 : 80, background: g.cardBg, borderRight: `1px solid ${g.divider}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .28s cubic-bezier(.4,1,0.2,1)', overflow: 'hidden', backdropFilter: g.blur }}
    >
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', width: 240 }}>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: g.text, letterSpacing: '-0.03em', whiteSpace: 'nowrap', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          Swasthya Setu
        </span>
      </div>
      <nav style={{ flex: 1, padding: '0 0.75rem', width: 240 }}>
        <div onClick={() => navigate('/dashboard/dmo')} className={`nav-link ${isHome ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <HomeIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Home</span>
        </div>
        <div onClick={() => navigate('/dashboard/dmo/map')} className={`nav-link ${isMap ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <MapIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Districts Map</span>
        </div>
      </nav>
      <div style={{ padding: '1rem', borderTop: `1px solid ${g.divider}`, width: 240 }}>
        <div onClick={onAdminNav} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: '#6366f1', cursor: 'pointer', marginBottom: 8, border: '1px dashed #6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
          <span style={{ fontSize: '1.1rem' }}>🌐</span>
          <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Admin Mode</span>
        </div>
        <div onClick={onLogout} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer' }}>
          <LogoutIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Logout</span>
        </div>
      </div>
    </aside>
  )
}

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  const g = useMemo(() => ({
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)',
    insetBg: 'var(--g-inset-bg)',
    blur: 'var(--g-blur)',
  }), [isDark])

  const _savedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const dmoDistrict = _savedUser.district || 'Pune'
  const center = DISTRICT_CENTERS[dmoDistrict] || [18.5204, 73.8567]

  const [triageRecords, setTriageRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'patient_name', direction: 'asc' })

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, patRes] = await Promise.allSettled([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/patients/`, { headers }),
      ])
      if (triRes.status === 'fulfilled' && triRes.value.ok) setTriageRecords(await triRes.value.json())
      if (patRes.status === 'fulfilled' && patRes.value.ok) setPatients(await patRes.value.json())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const statsCount = useMemo(() => ({
    unreviewed: triageRecords.filter(r => !r.reviewed).length,
    critical: triageRecords.filter(r => r.severity === 'red' || Number(r.severity) >= 7).length,
    sickle: triageRecords.filter(r => r.sickle_cell_risk).length,
  }), [triageRecords])

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const sortedAndFilteredRecords = useMemo(() => {
    let items = [...triageRecords]
    if (selectedDate) {
      items = items.filter(r => {
        const d = new Date(r.created_at)
        return d.getDate() === selectedDate && d.getMonth() === 3 && d.getFullYear() === 2026
      })
    }
    items.sort((a, b) => {
      const aVal = a[sortConfig.key] || ''
      const bVal = b[sortConfig.key] || ''
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return items
  }, [triageRecords, sortConfig, selectedDate])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: ${g.divider}; border-radius: 10px; }
        .nav-link:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; color: ${g.accent}; }
        .nav-link.active { background: ${isDark ? 'rgba(59,130,246,0.15)' : '#ebf5ff'}; color: #3b82f6; font-weight: 700; border-left: 3px solid #3b82f6; }
        .table-row:hover { background: ${g.insetBg}; cursor: pointer; }
      `}</style>

      <DMOSidebar
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        savedUser={_savedUser}
        onLogout={() => { logout(); navigate('/') }}
        onAdminNav={() => navigate('/dashboard/admin')}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <div style={{ position: 'relative', width: 360 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: g.label }}><SearchIcon /></span>
            <input type="text" placeholder="Search for patients or reports..." style={{ width: '100%', height: 44, padding: '0 1rem 0 3rem', background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 12, outline: 'none', fontSize: '0.875rem', color: g.text }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
              {(_savedUser.full_name || 'D')[0]}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: '0 0 0.25rem' }}>DMO Overview — {dmoDistrict}</h1>
              <p style={{ margin: 0, color: g.muted, fontSize: '0.9375rem' }}>Monitor real-time triage updates and patient distributions.</p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <StatCard label="Total Patients" value={patients.length} subtext="Registered in district" icon={UsersIcon} color="#3b82f6" g={g} />
              <StatCard label="Unreviewed" value={statsCount.unreviewed} subtext="Pending validation" icon={FileTextIcon} color="#f59e0b" g={g} />
              <StatCard label="Critical Alerts" value={statsCount.critical} subtext="Red severity cases" icon={ActivityIcon} color="#ef4444" g={g} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <PatientOverviewChart g={g} />
              <CalendarWidget selectedDate={selectedDate} setSelectedDate={setSelectedDate} g={g} />
            </div>

            <div style={{ background: g.cardBg, borderRadius: 16, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, overflow: 'hidden', backdropFilter: g.blur }}>
              <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}` }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>Recent Patient Triage</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: g.insetBg }}>
                    <tr>
                      {[
                        { label: 'Patient Name', key: 'patient_name' },
                        { label: 'Identification No.', key: 'patient_id' },
                        { label: 'Location', key: 'district' },
                        { label: 'Status', key: 'reviewed' },
                        { label: 'Severity', key: 'severity' }
                      ].map(col => (
                        <th key={col.label} onClick={() => handleSort(col.key)}
                          style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}>
                          {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredRecords.slice(0, 8).map((record, i) => (
                      <tr key={record.id} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i % 2 === 0 ? '#3b82f6' : '#10b981', fontWeight: 800, fontSize: '0.8125rem' }}>
                              {(record.patient_name || 'P')[0]}
                            </div>
                            <div style={{ fontWeight: 700, color: g.text, fontSize: '0.9375rem' }}>{record.patient_name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: g.muted, fontSize: '0.875rem' }}>ID-{record.patient_id?.substring(0, 6) || record.id?.substring(0, 6) || 'N/A'}</td>
                        <td style={{ padding: '1rem 1.5rem', color: g.muted, fontSize: '0.875rem' }}>
                          <div>{record.district || dmoDistrict}</div>
                          {record.latitude && record.longitude && (
                            <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: 4, fontWeight: 600 }}>
                              📍 {Number(record.latitude).toFixed(5)}, {Number(record.longitude).toFixed(5)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, background: record.reviewed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: record.reviewed ? '#10b981' : '#f59e0b' }}>
                            {record.reviewed ? 'Checked' : 'Awaiting'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: (record.severity === 'red' || Number(record.severity) >= 7) ? '#ef4444' : (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? '#f59e0b' : '#10b981' }}>
                            {(record.severity === 'red' || Number(record.severity) >= 7) ? 'CRITICAL' : (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? 'MODERATE' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}