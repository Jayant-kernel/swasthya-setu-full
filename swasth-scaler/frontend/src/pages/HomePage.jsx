import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProfileOverlay from '../components/ProfileOverlay.jsx'

/* ── Constants ─────────────────────────────────────────── */
const ALL_DISTRICTS = [
  "Ahilyanagar","Akola","Amravati","Beed","Bhandara","Buldhana","Chandrapur",
  "Chhatrapati Sambhajinagar","Dharashiv","Dhule","Gadchiroli","Gondia","Hingoli",
  "Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur",
  "Nanded","Nandurbar","Nashik","Palghar","Parbhani","Pune","Raigad","Ratnagiri",
  "Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal",
]
const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

/* ── Sidebar nav items ─────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'home',    label: 'Dashboard',     icon: GridIcon,    path: '/home' },
  { id: 'patient', label: 'New Patient',   icon: PatientIcon, path: '/patient' },
  { id: 'chat',    label: 'AI Chat',       icon: ChatIcon,    path: '/chat' },
]

const DISTRICT_GROUPS = [
  { label: 'Pune', color: '#6366f1' },
  { label: 'Nagpur', color: '#f59e0b' },
  { label: 'Nashik', color: '#10b981' },
]

/* ── SVG Icon helpers ──────────────────────────────────── */
function GridIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function PatientIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
    </svg>
  )
}
function ListIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <circle cx="3" cy="6" r="1" fill={color}/><circle cx="3" cy="12" r="1" fill={color}/><circle cx="3" cy="18" r="1" fill={color}/>
    </svg>
  )
}
function ChatIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function HandIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  )
}
function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function BellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function ChevronIcon({ size = 14, dir = 'right' }) {
  const r = dir === 'right' ? 0 : dir === 'down' ? 90 : 180
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${r}deg)` }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
function FilterIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  )
}
function TrashIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

/* ── Severity helpers ──────────────────────────────────── */
const SEV_META = {
  red:    { label: 'Emergency', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  yellow: { label: 'Moderate',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  green:  { label: 'Stable',    color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
}

function SeverityPill({ severity }) {
  const m = SEV_META[severity]
  if (!m) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: '0.72rem', fontWeight: 700, color: m.color, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
      {m.label}
    </span>
  )
}

function PriorityBadge({ severity }) {
  const labels = { red: 'High', yellow: 'Medium', green: 'Low' }
  const colors = { red: '#ef4444', yellow: '#f59e0b', green: '#10b981' }
  const bgs    = { red: '#fef2f2', yellow: '#fffbeb', green: '#f0fdf4' }
  const label = labels[severity] || '—'
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: 99,
      background: bgs[severity] || '#f3f4f6',
      color: colors[severity] || '#6b7280',
      fontSize: '0.72rem', fontWeight: 700,
    }}>{label}</span>
  )
}

/* ══════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [activeTab,      setActiveTab]      = useState('ALL')
  const [viewTab,        setViewTab]        = useState('Table')   // Table | Board
  const [sortMode,       setSortMode]       = useState('latest')
  const [query,          setQuery]          = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [showProfile,    setShowProfile]    = useState(false)
  const [theme,          setTheme]          = useState(localStorage.getItem('theme') || 'light')
  const debounceRef = useRef(null)

  const [patientResults, setPatientResults] = useState([])
  const [loading,        setLoading]        = useState(false)
  const [totalCount,     setTotalCount]     = useState(0)
  const [showCount,      setShowCount]      = useState(50)
  const [dashError,      setDashError]      = useState(null)
  const [summaryCounts,  setSummaryCounts]  = useState({ red: 0, yellow: 0, green: 0 })

  // Theme sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Prompt profile if missing
  useEffect(() => {
    if (user && (!user.full_name || !user.location)) setShowProfile(true)
  }, [user])

  // Summary counts
  useEffect(() => {
    const counts = { red: 0, yellow: 0, green: 0 }
    patientResults.forEach(p => { if (p.latestSeverity && counts[p.latestSeverity] !== undefined) counts[p.latestSeverity]++ })
    setSummaryCounts(counts)
  }, [patientResults])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let records = res.ok ? await res.json() : []
      let rows = records || []
      if (activeTab !== 'ALL') rows = rows.filter(r => r.severity === activeTab.toLowerCase())
      if (query.trim().length >= 2) rows = rows.filter(r => r.patient_name?.toLowerCase().includes(query.trim().toLowerCase()))
      if (districtFilter) rows = rows.filter(r => r.district === districtFilter)

      const grouped = new Map()
      for (const r of rows) {
        const key = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.district}`
        if (!grouped.has(key)) {
          grouped.set(key, { id: r.patient_id || key, name: r.patient_name, age: r.age, gender: r.gender, district: r.district, triage_records: [] })
        }
        grouped.get(key).triage_records.push({ id: r.id, severity: r.severity, brief: r.brief, created_at: r.created_at, district: r.district })
      }

      let patients = Array.from(grouped.values()).map(p => {
        p.triage_records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        p.latestSeverity = p.triage_records[0]?.severity || null
        return p
      })
      if (sortMode === 'critical') patients.sort((a, b) => (SEVERITY_ORDER[a.latestSeverity] ?? 3) - (SEVERITY_ORDER[b.latestSeverity] ?? 3))

      setPatientResults(patients)
      setTotalCount(patients.length)
      setShowCount(50)
    } catch (err) {
      setDashError(err?.message || 'Unknown error')
      setPatientResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, query, districtFilter, sortMode])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchRecords, query ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [activeTab, query, districtFilter, sortMode, fetchRecords])

  function handlePatientCardClick(p) {
    navigate('/patient', { state: { prefill: { name: p.name, age: p.age, gender: p.gender, district: p.district }, patientId: p.id } })
  }

  async function handleDeletePatient(e, patientId) {
    e.stopPropagation()
    if (!window.confirm('Delete ALL records for this patient? This cannot be undone.')) return
    setPatientResults(prev => prev.filter(p => p.id !== patientId))
    setTotalCount(prev => prev - 1)
  }

  const visiblePatients = patientResults.slice(0, showCount)

  // Group patients by severity for the table sections
  const groups = [
    { key: 'red',    label: '🔴 Emergency',   dot: '#ef4444', patients: visiblePatients.filter(p => p.latestSeverity === 'red') },
    { key: 'yellow', label: '🟡 Moderate',    dot: '#f59e0b', patients: visiblePatients.filter(p => p.latestSeverity === 'yellow') },
    { key: 'green',  label: '🟢 Stable',      dot: '#10b981', patients: visiblePatients.filter(p => p.latestSeverity === 'green') },
    { key: 'none',   label: '⚪ Unclassified', dot: '#9ca3af', patients: visiblePatients.filter(p => !p.latestSeverity) },
  ].filter(g => g.patients.length > 0)

  const isDark = theme === 'dark'

  /* ── Styles ─── */
  const S = {
    root: {
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'Inter', 'Noto Sans', sans-serif",
      background: isDark 
        ? 'radial-gradient(circle at top left, rgba(76, 29, 149, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.1), transparent 40%), #0f1117'
        : 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.08), transparent 40%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.08), transparent 40%), #f8fafc',
      color: isDark ? '#e5e7eb' : '#111827',
    },
    /* Sidebar */
    sidebar: {
      width: sidebarOpen ? 220 : 0,
      minWidth: sidebarOpen ? 220 : 0,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      flexShrink: 0,
    },
    sidebarInner: { 
      width: 220, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      background: isDark ? 'rgba(22, 24, 31, 0.65)' : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
    },
    /* Main */
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
    topbar: {
      background: isDark ? 'rgba(22, 24, 31, 0.65)' : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      padding: '0 1.5rem', height: 60,
      display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0,
      position: 'relative', zIndex: 10
    },
    content: { flex: 1, overflowY: 'auto', padding: '1.5rem', position: 'relative', zIndex: 1 },
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#2d3148' : '#e5e7eb'}; border-radius: 99px; }
        .nav-btn:hover { background: ${isDark ? '#1e2030' : '#f3f4f6'} !important; }
        .row-btn:hover { background: ${isDark ? '#1e2030' : '#f9fafb'} !important; cursor: pointer; }
        .action-btn:hover { background: ${isDark ? '#2d3148' : '#f3f4f6'} !important; }
        .del-btn:hover { background: #fef2f2 !important; color: #ef4444 !important; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside style={S.sidebar}>
        <div style={S.sidebarInner}>
          {/* Dropdown arrow replacing hamburger */}
          <div style={{ padding: '1.25rem 1rem 0.75rem', borderBottom: `1px solid ${isDark ? '#1f2230' : '#f3f4f6'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0F6E56, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '1rem' }}>🏥</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: isDark ? '#f9fafb' : '#111827', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.65rem', color: isDark ? '#6b7280' : '#9ca3af', fontWeight: 500 }}>ASHA Dashboard</div>
              </div>
            </div>
            <button className="action-btn" onClick={() => setSidebarOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, background: isDark ? '#1f2230' : '#ffffff', boxShadow: isDark ? '0 2px 5px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', color: isDark ? '#6b7280' : '#9ca3af' }}>
              <ChevronIcon size={14} dir="down" />
            </button>
          </div>

          {/* Nav */}
          <div style={{ padding: '0.75rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#4b5563' : '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>Menu</div>

            {NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path)
              const Icon = item.icon
              return (
                <button key={item.id} className="nav-btn"
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.4rem 0.75rem', borderRadius: 10, border: 'none',
                    background: isActive ? (isDark ? 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.02) 100%)' : 'linear-gradient(90deg, #f5f3ff 0%, rgba(245,243,255,0.2) 100%)') : 'transparent',
                    boxShadow: isActive ? (isDark ? 'inset 3px 0 0 #8b5cf6' : 'inset 3px 0 0 #7c3aed') : 'none',
                    color: isActive ? (isDark ? '#a78bfa' : '#6d28d9') : (isDark ? '#9ca3af' : '#6b7280'),
                    fontWeight: isActive ? 600 : 500, fontSize: '0.875rem',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? (isDark ? 'rgba(139,92,246,0.2)' : '#ede9fe') : 'transparent',
                    color: isActive ? (isDark ? '#c4b5fd' : '#7c3aed') : 'inherit',
                    transition: 'all 0.2s'
                  }}>
                    <Icon size={16} active={isActive} />
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronIcon size={14} color="currentColor" />}
                </button>
              )
            })}

            {/* District shortcuts */}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isDark ? '#4b5563' : '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem', marginTop: '1.25rem' }}>Districts</div>
            {DISTRICT_GROUPS.map(d => {
              const active = districtFilter === d.label;
              return (
                <button key={d.label} className="nav-btn"
                  onClick={() => setDistrictFilter(active ? '' : d.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.4rem 0.75rem', borderRadius: 10, border: 'none',
                    background: active ? `${d.color}15` : 'transparent',
                    boxShadow: active ? `inset 3px 0 0 ${d.color}` : 'none',
                    color: active ? d.color : (isDark ? '#9ca3af' : '#6b7280'),
                    fontWeight: active ? 600 : 500, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: d.color, boxShadow: active ? `0 0 8px ${d.color}` : 'none', transition: 'all 0.2s' }} />
                  </div>
                  <span style={{ flex: 1 }}>{d.label}</span>
                  {active && <ChevronIcon size={14} color="currentColor" />}
                </button>
              )
            })}
          </div>

          {/* User profile bottom */}
          <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${isDark ? '#1f2230' : '#f3f4f6'}` }}>
            <button className="nav-btn" onClick={() => setShowProfile(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.5rem', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0F6E56, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: isDark ? '#f9fafb' : '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.6875rem', color: isDark ? '#6b7280' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.employee_id}</div>
              </div>
              <ChevronIcon size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════ */}
      <div style={S.main}>

        {/* Top bar */}
        <div style={S.topbar}>

          {/* Re-expand Sidebar Button (only visible if sidebar is collapsed) */}
          {!sidebarOpen && (
            <button className="action-btn" onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', color: isDark ? '#e5e7eb' : '#111827' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          {/* Search */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: isDark ? '#4b5563' : '#9ca3af', pointerEvents: 'none' }}>
              <SearchIcon size={15} />
            </span>
            <input
              placeholder="Search patients…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', height: 36, paddingLeft: '2.25rem', paddingRight: '0.75rem',
                borderRadius: 8, border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`,
                background: isDark ? '#1a1d27' : '#f9fafb',
                color: isDark ? '#e5e7eb' : '#111827', fontSize: '0.875rem', outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: isDark ? '#374151' : '#d1d5db', fontWeight: 600, background: isDark ? '#1f2230' : '#f3f4f6', padding: '2px 5px', borderRadius: 4, pointerEvents: 'none' }}>⌘ K</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <button className="action-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.15s', flexShrink: 0 }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Bell */}
          <button className="action-btn"
            style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#9ca3af' : '#6b7280', position: 'relative', transition: 'all 0.15s', flexShrink: 0 }}>
            <BellIcon size={17} />
            {summaryCounts.red > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />}
          </button>

          {/* New Patient CTA */}
          <button onClick={() => navigate('/patient')}
            style={{ height: 36, padding: '0 1rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}>
            + New Patient
          </button>
        </div>

        {/* Content */}
        <div style={S.content}>

          {/* ── Stat summary chips (replacing big cards) ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: 99, border: `1.5px solid ${activeTab === 'ALL' ? '#3b82f6' : (isDark ? '#1f2230' : '#e5e7eb')}`,
                background: activeTab === 'ALL' ? '#3b82f6' : (isDark ? '#1a1d27' : '#fff'),
                color: activeTab === 'ALL' ? '#fff' : (isDark ? '#9ca3af' : '#4b5563'),
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
              All ({totalCount})
            </button>
            {[
              { sev: 'red',    emoji: '🚨', label: 'Emergency',  count: summaryCounts.red,    color: '#ef4444', bg: isDark ? '#2d1515' : '#fef2f2', border: '#fca5a5' },
              { sev: 'yellow', emoji: '⚠️', label: 'Moderate',   count: summaryCounts.yellow, color: '#d97706', bg: isDark ? '#2d2210' : '#fffbeb', border: '#fcd34d' },
              { sev: 'green',  emoji: '✅', label: 'Stable',     count: summaryCounts.green,  color: '#059669', bg: isDark ? '#0d2520' : '#f0fdf4', border: '#6ee7b7' },
            ].map(s => {
              const active = activeTab === s.sev.toUpperCase();
              return (
                <button key={s.sev}
                  onClick={() => setActiveTab(active ? 'ALL' : s.sev.toUpperCase())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.875rem', borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s',
                    background: active ? s.bg : (isDark ? '#1a1d27' : '#fff'),
                    border: `1.5px solid ${active ? s.border : (isDark ? '#1f2230' : '#e5e7eb')}`,
                    color: active ? s.color : (isDark ? '#e5e7eb' : '#4b5563'),
                    fontSize: '0.8125rem', fontWeight: 600,
                  }}>
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                  <span style={{ 
                    background: active ? s.color : (isDark ? '#374151' : '#f3f4f6'), 
                    color: active ? '#fff' : (isDark ? '#9ca3af' : '#4b5563'), 
                    padding: '0 6px', borderRadius: 99, fontSize: '0.7rem' 
                  }}>{s.count}</span>
                </button>
              )
            })}
          </div>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: isDark ? '#f9fafb' : '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Your Patient List
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* District filter */}
              <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
                style={{ height: 34, padding: '0 0.75rem', fontSize: '0.8125rem', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 8, background: isDark ? '#16181f' : '#fff', color: isDark ? '#e5e7eb' : '#111827', outline: 'none' }}>
                <option value="">All Districts</option>
                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Sort */}
              <select value={sortMode} onChange={e => setSortMode(e.target.value)}
                style={{ height: 34, padding: '0 0.75rem', fontSize: '0.8125rem', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 8, background: isDark ? '#16181f' : '#fff', color: isDark ? '#e5e7eb' : '#111827', outline: 'none' }}>
                <option value="latest">Latest first</option>
                <option value="critical">Critical first</option>
              </select>

              {/* Filter pill */}
              <button className="action-btn"
                style={{ height: 34, padding: '0 0.75rem', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 8, background: isDark ? '#16181f' : '#fff', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                <FilterIcon size={13} /> Filter
              </button>
            </div>
          </div>

          {/* ── View tabs ── */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
            {['Table', 'Board'].map(t => (
              <button key={t} onClick={() => setViewTab(t)}
                style={{
                  padding: '0.375rem 1rem', borderRadius: 8, border: 'none',
                  background: viewTab === t ? '#3b82f6' : (isDark ? '#1a1d27' : '#f3f4f6'),
                  color: viewTab === t ? '#fff' : (isDark ? '#9ca3af' : '#6b7280'),
                  fontWeight: viewTab === t ? 700 : 500, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>{t}</button>
            ))}
          </div>

          {/* ── Error ── */}
          {dashError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1rem', color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {dashError} — <button onClick={() => { setDashError(null); fetchRecords() }} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
            </div>
          )}

          {/* ── Skeleton ── */}
          {loading && patientResults.length === 0 && (
            <div style={{ background: isDark ? '#16181f' : '#fff', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderBottom: `1px solid ${isDark ? '#1f2230' : '#f3f4f6'}`, opacity: 0.5 }}>
                  {[30, 20, 15, 12, 10].map((w, j) => <div key={j} style={{ height: 12, background: isDark ? '#1f2230' : '#e5e7eb', borderRadius: 4, flex: `0 0 ${w}%` }} />)}
                </div>
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && patientResults.length === 0 && !dashError && (
            <div style={{ textAlign: 'center', padding: '4rem', color: isDark ? '#4b5563' : '#9ca3af', background: isDark ? '#16181f' : '#fff', borderRadius: 12, border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}` }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: isDark ? '#9ca3af' : '#6b7280' }}>No patients found</div>
              <div style={{ fontSize: '0.875rem' }}>Add a new patient to get started.</div>
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {viewTab === 'Table' && groups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {groups.map(group => (
                <div key={group.key} style={{ background: isDark ? '#16181f' : '#fff', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: isDark ? '#1a1d27' : '#f9fafb', borderBottom: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: isDark ? '#e5e7eb' : '#111827' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.dot, display: 'inline-block' }} />
                      {group.label}
                      <span style={{ fontWeight: 500, color: isDark ? '#4b5563' : '#9ca3af', fontSize: '0.8125rem' }}>({group.patients.length})</span>
                    </div>
                    <button onClick={() => navigate('/patient')}
                      style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${isDark ? '#2d3148' : '#e5e7eb'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#6b7280' : '#9ca3af', fontSize: '1rem', lineHeight: 1 }}>+</button>
                  </div>

                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 0.5fr', padding: '0.5rem 1.5rem', borderBottom: `1px solid ${isDark ? '#1f2230' : '#f3f4f6'}` }}>
                    {['Name', 'Last Visit', 'District', 'Priority', 'Status', ''].map(col => (
                      <div key={col} style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? '#4b5563' : '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{col}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  {group.patients.map((p, idx) => {
                    const last = p.triage_records?.[0]
                    return (
                      <div key={p.id} className="row-btn"
                        onClick={() => handlePatientCardClick(p)}
                        style={{
                          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 0.5fr',
                          padding: '0.75rem 1.5rem', alignItems: 'center',
                          borderBottom: idx < group.patients.length - 1 ? `1px solid ${isDark ? '#1a1d27' : '#f9fafb'}` : 'none',
                          transition: 'background 0.12s',
                        }}>
                        {/* Name */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#f9fafb' : '#111827' }}>{p.name}</span>
                          <span style={{ fontSize: '0.75rem', color: isDark ? '#4b5563' : '#9ca3af' }}>
                            {[p.age && `${p.age} yrs`, p.gender].filter(Boolean).join(' · ')}
                            {last?.brief ? ` · ${last.brief.slice(0, 30)}${last.brief.length > 30 ? '…' : ''}` : ''}
                          </span>
                        </div>
                        {/* Last visit */}
                        <div style={{ fontSize: '0.8125rem', color: isDark ? '#9ca3af' : '#374151', fontWeight: 500 }}>
                          {last ? timeAgo(last.created_at) : '—'}
                        </div>
                        {/* District */}
                        <div style={{ fontSize: '0.8125rem', color: isDark ? '#9ca3af' : '#374151', fontWeight: 500 }}>
                          {p.district || '—'}
                        </div>
                        {/* Priority */}
                        <div><PriorityBadge severity={p.latestSeverity} /></div>
                        {/* Status */}
                        <div><SeverityPill severity={p.latestSeverity} /></div>
                        {/* Delete */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="del-btn"
                            onClick={(e) => handleDeletePatient(e, p.id)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${isDark ? '#2d3148' : '#e5e7eb'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#6b7280' : '#9ca3af', transition: 'all 0.15s' }}>
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── BOARD VIEW ── */}
          {viewTab === 'Board' && groups.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {groups.map(group => (
                <div key={group.key} style={{ background: isDark ? '#16181f' : '#fff', border: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: isDark ? '#1a1d27' : '#f9fafb', borderBottom: `1px solid ${isDark ? '#1f2230' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.dot }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isDark ? '#f9fafb' : '#111827' }}>{group.label}</span>
                    <span style={{ fontWeight: 500, color: isDark ? '#4b5563' : '#9ca3af', fontSize: '0.8125rem' }}>({group.patients.length})</span>
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.patients.map(p => {
                      const last = p.triage_records?.[0]
                      return (
                        <div key={p.id} className="row-btn"
                          onClick={() => handlePatientCardClick(p)}
                          style={{ padding: '0.75rem', borderRadius: 8, border: `1px solid ${isDark ? '#1f2230' : '#f3f4f6'}`, background: isDark ? '#1a1d27' : '#fafafa', transition: 'all 0.15s' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isDark ? '#f9fafb' : '#111827', marginBottom: 4 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: isDark ? '#6b7280' : '#9ca3af', marginBottom: 8 }}>{[p.age && `${p.age} yrs`, p.gender, p.district].filter(Boolean).join(' · ')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <SeverityPill severity={p.latestSeverity} />
                            <span style={{ fontSize: '0.7rem', color: isDark ? '#4b5563' : '#9ca3af' }}>{last ? timeAgo(last.created_at) : ''}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show more */}
          {patientResults.length > showCount && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCount(c => c + 50)}
                style={{ padding: '0.625rem 1.5rem', borderRadius: 8, border: `1.5px solid #3b82f6`, color: '#3b82f6', background: 'transparent', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                Load more ({patientResults.length - showCount} remaining)
              </button>
            </div>
          )}

        </div>
      </div>

      {showProfile && <ProfileOverlay onClose={() => setShowProfile(false)} />}
    </div>
  )
}
