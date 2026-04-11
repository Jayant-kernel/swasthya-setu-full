import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProfileOverlay from '../components/ProfileOverlay.jsx'
import logo from '../images/logo/logo.png'

/* ── Constants ─────────────────────────────────────────── */
const ALL_DISTRICTS = [
  "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur",
  "Chhatrapati Sambhajinagar", "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur",
  "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri",
  "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
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

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', icon: ChatIcon, path: '/chat' },
]

const DISTRICT_GROUPS = [
  { label: 'Pune', color: '#818cf8' },
  { label: 'Nagpur', color: '#fbbf24' },
  { label: 'Nashik', color: '#34d399' },
]

/* ── SVG Icon helpers ──────────────────────────────────── */
function GridIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function PatientIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  )
}
function ChatIcon({ size = 16, color = 'currentColor', active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function ChevronIcon({ size = 14, dir = 'right', color = 'currentColor' }) {
  const r = dir === 'right' ? 0 : dir === 'down' ? 90 : 180
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${r}deg)` }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function FilterIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
function TrashIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}

/* ── Severity helpers ──────────────────────────────────── */
const SEV_META = {
  red: { label: 'Emergency', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  yellow: { label: 'Moderate', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  green: { label: 'Stable', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
}

function SeverityPill({ severity }) {
  const m = SEV_META[severity]
  if (!m) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: '0.72rem', fontWeight: 700, color: m.color,
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, display: 'inline-block', boxShadow: `0 0 5px ${m.color}` }} />
      {m.label}
    </span>
  )
}

function PriorityBadge({ severity }) {
  const map = {
    red: { label: 'High', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)' },
    yellow: { label: 'Medium', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
    green: { label: 'Low', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.2)' },
  }
  const m = map[severity] || { label: '—', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      fontSize: '0.72rem', fontWeight: 700,
      backdropFilter: 'blur(8px)',
    }}>{m.label}</span>
  )
}

const ThemeMorphIcon = ({ isDark, color, idSuffix }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ color, transform: isDark ? 'rotate(-45deg)' : 'rotate(0deg)', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
    <mask id={`moon-mask-${idSuffix}`}>
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <circle cx={isDark ? "15" : "28"} cy={isDark ? "6" : "-8"} r="8" fill="black"
        style={{ transition: 'cx 0.5s cubic-bezier(0.4,0,0.2,1), cy 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </mask>
    <circle cx="12" cy="12" r={isDark ? "9" : "5"} mask={`url(#moon-mask-${idSuffix})`}
      fill={isDark ? "currentColor" : "transparent"}
      style={{ transition: 'r 0.5s cubic-bezier(0.4,0,0.2,1), fill 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    <g style={{ transform: isDark ? 'scale(0)' : 'scale(1)', transformOrigin: '12px 12px', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', opacity: isDark ? 0 : 1 }}>
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  </svg>
)

/* ══════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('ALL')
  const [viewTab, setViewTab] = useState('Table')
  const [sortMode, setSortMode] = useState('latest')
  const [query, setQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const debounceRef = useRef(null)

  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [showCount, setShowCount] = useState(50)
  const [dashError, setDashError] = useState(null)
  const [summaryCounts, setSummaryCounts] = useState({ red: 0, yellow: 0, green: 0 })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

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
  const groups = [
    { key: 'red', label: 'Emergency', dot: '#f87171', patients: visiblePatients.filter(p => p.latestSeverity === 'red') },
    { key: 'yellow', label: 'Moderate', dot: '#fbbf24', patients: visiblePatients.filter(p => p.latestSeverity === 'yellow') },
    { key: 'green', label: 'Stable', dot: '#34d399', patients: visiblePatients.filter(p => p.latestSeverity === 'green') },
    { key: 'none', label: 'Unclassified', dot: '#9ca3af', patients: visiblePatients.filter(p => !p.latestSeverity) },
  ].filter(g => g.patients.length > 0)

  const isDark = theme === 'dark'

  // ── Glass tokens ────────────────────────────────────────
  const clr = {
    bgBase: isDark ? '#0a0f1e' : '#dff5ee',

    glass: isDark ? 'rgba(10,20,40,0.35)' : 'rgba(255,255,255,0.22)',
    glassBorder: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.6)',
    glassBlur: 'blur(28px) saturate(180%)',

    // Cards — slightly more visible
    cardGlass: isDark ? 'rgba(15,25,50,0.45)' : 'rgba(255,255,255,0.32)',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.65)',

    // Sidebar
    sideGlass: isDark ? 'rgba(8,16,36,0.5)' : 'rgba(255,255,255,0.3)',
    sideBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.65)',

    // Row hover
    rowHover: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',

    // Text
    text: isDark ? '#e8f0ff' : '#0a2318',
    muted: isDark ? '#7a90b8' : '#3d6b58',
    topText: isDark ? '#e8f0ff' : '#0a2318',
    topMuted: isDark ? '#6070a0' : '#3d6b58',
    label: isDark ? '#5a7090' : '#6b9e8a',

    // Accent
    accent: '#20c997',
    accentSoft: isDark ? 'rgba(32,201,151,0.18)' : 'rgba(32,201,151,0.15)',
    accentBorder: isDark ? 'rgba(32,201,151,0.4)' : 'rgba(32,201,151,0.5)',

    // Nav active
    activeBg: isDark ? 'rgba(32,201,151,0.18)' : 'rgba(32,201,151,0.18)',
    activeBorder: isDark ? 'rgba(32,201,151,0.4)' : 'rgba(32,201,151,0.5)',
    activeText: isDark ? '#5eefc4' : '#0a5c3e',
    activeShadow: isDark
      ? 'inset 0 0 16px rgba(32,201,151,0.12), 0 2px 12px rgba(32,201,151,0.15)'
      : '0 2px 12px rgba(32,201,151,0.18)',
    iconBg: isDark ? 'rgba(32,201,151,0.2)' : 'rgba(32,201,151,0.16)',
    iconText: isDark ? '#5eefc4' : '#0a5c3e',
    hover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(32,201,151,0.09)',
    divider: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.55)',

    // Button glass
    btnGlass: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)',
    btnBorder: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.72)',
    btnColor: isDark ? '#b8cce8' : '#0a5c3e',

    // Group header
    groupHeader: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.25)',
  }

  // ── Shared glass card style ─────────────────────────────
  const glassCard = {
    background: clr.cardGlass,
    backdropFilter: clr.glassBlur,
    WebkitBackdropFilter: clr.glassBlur,
    border: `1px solid ${clr.cardBorder}`,
    borderRadius: 16,
    boxShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 8px 32px rgba(20,184,166,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
  }

  const glassInput = {
    border: `1px solid ${clr.glassBorder}`,
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    color: clr.topText, outline: 'none', transition: 'all 0.2s',
  }

  return (
    <div style={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      color: clr.text,
      position: 'relative',
      background: clr.bgBase,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${clr.glassBorder}; border-radius: 99px; }
        .nav-btn:hover    { background: ${clr.hover} !important; }
        .row-btn:hover    { background: ${clr.rowHover} !important; cursor: pointer; }
        .action-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'} !important; }
        .del-btn:hover    { background: rgba(239,68,68,0.15) !important; color: #f87171 !important; }
        .stat-chip:hover  { transform: translateY(-1px); }
        input::placeholder { color: ${clr.muted}; opacity: 0.7; }
        select option { background: ${isDark ? '#0d1a2e' : '#f0faf6'}; color: ${clr.text}; }
      `}</style>

      {/* ── Background blob layer ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(20,184,166,0.26) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }} />
        <div style={{
          position: 'absolute', top: '0%', right: '-18%',
          width: '52vw', height: '52vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)',
          filter: 'blur(75px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '25%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(52,211,153,0.16) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(110,231,183,0.4) 0%, transparent 70%)',
          filter: 'blur(65px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', left: '-8%',
          width: '32vw', height: '32vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
          filter: 'blur(55px)',
        }} />
      </div>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: sidebarOpen ? 220 : 0, minWidth: sidebarOpen ? 220 : 0,
        overflow: 'hidden', flexShrink: 0,
        background: clr.sideGlass,
        backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
        borderRight: `1px solid ${clr.sideBorder}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', zIndex: 20,
      }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

          {/* Logo */}
          <div style={{
            padding: '1.25rem 1rem 0.75rem',
            borderBottom: `1px solid ${clr.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isDark ? 'rgba(32,201,151,0.12)' : 'rgba(255,255,255,0.55)',
                border: `1px solid ${clr.glassBorder}`,
                filter: 'drop-shadow(0 0 10px rgba(32,201,151,0.3))'
              }}>
                <img src={logo} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: clr.topText, letterSpacing: '-0.025em', lineHeight: 1.2 }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.6rem', color: clr.accent, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ASHA Dashboard</div>
              </div>
            </div>
            <button className="action-btn" onClick={() => setSidebarOpen(o => !o)} style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${clr.btnBorder}`, background: clr.btnGlass,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s', color: clr.btnColor,
            }}>
              <ChevronIcon size={14} dir="down" color={clr.btnColor} />
            </button>
          </div>

          {/* Nav */}
          <div style={{ padding: '0.875rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: clr.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Menu</div>

            {NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path)
              const Icon = item.icon
              return (
                <button key={item.id} className="nav-btn"
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem', borderRadius: 10,
                    background: isActive ? clr.activeBg : 'transparent',
                    boxShadow: isActive ? clr.activeShadow : 'none',
                    border: isActive ? `1px solid ${clr.activeBorder}` : '1px solid transparent',
                    color: isActive ? clr.activeText : clr.topText,
                    fontWeight: isActive ? 600 : 500, fontSize: '0.875rem',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 3,
                    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    backdropFilter: isActive ? 'blur(8px)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = clr.hover }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? clr.iconBg : 'transparent',
                    color: isActive ? clr.iconText : 'inherit', transition: 'all 0.2s'
                  }}>
                    <Icon size={16} active={isActive} />
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronIcon size={12} color={clr.activeText} />}
                </button>
              )
            })}

            {/* District shortcuts */}
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: clr.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.5rem', marginTop: '1.25rem' }}>Districts</div>
            {DISTRICT_GROUPS.map(d => {
              const active = districtFilter === d.label
              return (
                <button key={d.label} className="nav-btn"
                  onClick={() => setDistrictFilter(active ? '' : d.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.4rem 0.75rem', borderRadius: 10,
                    background: active ? `${d.color}18` : 'transparent',
                    boxShadow: active ? `inset 3px 0 0 ${d.color}` : 'none',
                    border: '1px solid transparent',
                    color: active ? d.color : clr.topText,
                    fontWeight: active ? 600 : 500, fontSize: '0.875rem',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 3, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = clr.hover }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${d.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, boxShadow: active ? `0 0 8px ${d.color}` : 'none', transition: 'all 0.2s' }} />
                  </div>
                  <span style={{ flex: 1 }}>{d.label}</span>
                  {active && <ChevronIcon size={12} color={d.color} />}
                </button>
              )
            })}
          </div>

          {/* User */}
          <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${clr.divider}` }}>
            <button className="nav-btn" onClick={() => navigate('/profile')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: clr.topText, transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = clr.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #20c997)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 2px rgba(32,201,151,0.3)' }}>
                <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: clr.topText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.6875rem', color: clr.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.employee_id}</div>
              </div>
              <ChevronIcon size={12} color={clr.muted} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 5 }}>

        {/* Top bar */}
        <div style={{
          background: clr.glass,
          backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
          borderBottom: `1px solid ${clr.glassBorder}`,
          padding: '0 1.5rem', height: 60,
          display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0,
          position: 'relative', zIndex: 10,
        }}>
          {/* Left */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {!sidebarOpen && (
              <button className="action-btn" onClick={() => setSidebarOpen(true)} style={{
                width: 36, height: 36, borderRadius: 9,
                border: `1px solid ${clr.btnBorder}`, background: clr.btnGlass,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s', color: clr.btnColor,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ width: '100%', maxWidth: 340, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: clr.muted, pointerEvents: 'none' }}>
              <SearchIcon size={15} />
            </span>
            <input placeholder="Search patients…" value={query} onChange={e => setQuery(e.target.value)}
              style={{
                ...glassInput,
                width: '100%', height: 36, paddingLeft: '2.25rem', paddingRight: '2.5rem',
                borderRadius: 9, fontSize: '0.875rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              onFocus={e => { e.target.style.borderColor = clr.accent; e.target.style.boxShadow = `0 0 0 3px ${clr.accentSoft}` }}
              onBlur={e => { e.target.style.borderColor = clr.glassBorder; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.62rem', color: clr.muted, fontWeight: 600, background: clr.btnGlass, padding: '1px 5px', borderRadius: 4, pointerEvents: 'none', backdropFilter: 'blur(8px)' }}>⌘K</span>
          </div>

          {/* Right */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="action-btn" aria-label="Toggle theme"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `1px solid ${clr.btnBorder}`, background: clr.btnGlass,
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0
              }}>
              <ThemeMorphIcon isDark={isDark} color={clr.btnColor} idSuffix="home" />
            </button>

            <button onClick={() => navigate('/patient')} style={{
              height: 36, padding: '0 1rem', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'linear-gradient(135deg, #0d9488 0%, #20c997 50%, #6366f1 100%)',
              color: '#fff', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '0.375rem', flexShrink: 0, transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(32,201,151,0.3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              + New Patient
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', position: 'relative', zIndex: 1 }}>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {/* ALL chip */}
            <button className="stat-chip"
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === 'ALL' ? clr.accent : clr.cardGlass,
                backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
                border: `1px solid ${activeTab === 'ALL' ? clr.accent : clr.cardBorder}`,
                color: activeTab === 'ALL' ? '#fff' : clr.text,
                fontSize: '0.8125rem', fontWeight: 600,
                boxShadow: activeTab === 'ALL' ? '0 4px 14px rgba(32,201,151,0.35)' : '0 2px 8px rgba(0,0,0,0.08)',
              }}>
              All ({totalCount})
            </button>

            {[
              { sev: 'red', emoji: '🚨', label: 'Emergency', count: summaryCounts.red, color: '#f87171', activeBg: 'rgba(239,68,68,0.25)' },
              { sev: 'yellow', emoji: '⚠️', label: 'Moderate', count: summaryCounts.yellow, color: '#fbbf24', activeBg: 'rgba(245,158,11,0.25)' },
              { sev: 'green', emoji: '✅', label: 'Stable', count: summaryCounts.green, color: '#34d399', activeBg: 'rgba(52,211,153,0.25)' },
            ].map(s => {
              const active = activeTab === s.sev.toUpperCase()
              return (
                <button key={s.sev} className="stat-chip"
                  onClick={() => setActiveTab(active ? 'ALL' : s.sev.toUpperCase())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.875rem', borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
                    background: active ? s.activeBg : clr.cardGlass,
                    backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
                    border: `1px solid ${active ? s.color : clr.cardBorder}`,
                    color: active ? s.color : clr.text,
                    fontSize: '0.8125rem', fontWeight: 600,
                    boxShadow: active ? `0 4px 14px ${s.color}30` : '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                  <span style={{ fontSize: '0.75rem' }}>{s.emoji}</span>
                  <span>{s.label}</span>
                  <span style={{
                    background: active ? `${s.color}25` : clr.btnGlass,
                    color: active ? s.color : clr.muted,
                    padding: '0 6px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700
                  }}>{s.count}</span>
                </button>
              )
            })}
          </div>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: clr.topText, margin: 0, letterSpacing: '-0.025em' }}>
              Your Patient List
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
                style={{ ...glassInput, height: 34, padding: '0 0.75rem', fontSize: '0.8125rem', borderRadius: 8 }}>
                <option value="">All Districts</option>
                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={sortMode} onChange={e => setSortMode(e.target.value)}
                style={{ ...glassInput, height: 34, padding: '0 0.75rem', fontSize: '0.8125rem', borderRadius: 8 }}>
                <option value="latest">Latest first</option>
                <option value="critical">Critical first</option>
              </select>

              <button className="action-btn" style={{
                height: 34, padding: '0 0.75rem', border: `1px solid ${clr.glassBorder}`,
                borderRadius: 8, ...glassInput, fontSize: '0.8125rem', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: clr.muted,
              }}>
                <FilterIcon size={13} /> Filter
              </button>
            </div>
          </div>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
            {['Table', 'Board'].map(t => (
              <button key={t} onClick={() => setViewTab(t)} style={{
                padding: '0.35rem 1rem', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                background: viewTab === t ? clr.accentSoft : clr.btnGlass,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${viewTab === t ? clr.accentBorder : clr.glassBorder}`,
                color: viewTab === t ? clr.accent : clr.muted,
                fontWeight: viewTab === t ? 700 : 500, fontSize: '0.875rem',
              }}>{t}</button>
            ))}
          </div>

          {/* Error */}
          {dashError && (
            <div style={{ ...glassCard, padding: '1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem', borderColor: 'rgba(239,68,68,0.3)' }}>
              {dashError} — <button onClick={() => { setDashError(null); fetchRecords() }} style={{ color: clr.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
            </div>
          )}

          {/* Skeleton */}
          {loading && patientResults.length === 0 && (
            <div style={{ ...glassCard, overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderBottom: `1px solid ${clr.divider}`, opacity: 0.4 }}>
                  {[30, 20, 15, 12, 10].map((w, j) => <div key={j} style={{ height: 10, background: clr.glassBorder, borderRadius: 4, flex: `0 0 ${w}%` }} />)}
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && patientResults.length === 0 && !dashError && (
            <div style={{ ...glassCard, textAlign: 'center', padding: '4rem', color: clr.muted }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: clr.text }}>No patients found</div>
              <div style={{ fontSize: '0.875rem' }}>Add a new patient to get started.</div>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewTab === 'Table' && groups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groups.map(group => (
                <div key={group.key} style={{ ...glassCard, overflow: 'hidden' }}>
                  {/* Group header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1.5rem',
                    background: clr.groupHeader,
                    borderBottom: `1px solid ${clr.divider}`,
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: clr.topText }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: group.dot, display: 'inline-block', boxShadow: `0 0 6px ${group.dot}` }} />
                      {group.label}
                      <span style={{ fontWeight: 500, color: clr.muted, fontSize: '0.8125rem' }}>({group.patients.length})</span>
                    </div>
                    <button onClick={() => navigate('/patient')} style={{
                      width: 24, height: 24, borderRadius: 6,
                      border: `1px solid ${clr.glassBorder}`, background: clr.btnGlass,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: clr.muted, fontSize: '1rem', lineHeight: 1,
                    }}>+</button>
                  </div>

                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1fr 0.5fr', padding: '0.5rem 1.5rem', borderBottom: `1px solid ${clr.divider}` }}>
                    {['Name', 'Last Visit', 'District', 'Priority', 'Status', ''].map(col => (
                      <div key={col} style={{ fontSize: '0.65rem', fontWeight: 700, color: clr.label, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{col}</div>
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
                          borderBottom: idx < group.patients.length - 1 ? `1px solid ${clr.divider}` : 'none',
                          transition: 'background 0.15s',
                        }}>
                        {/* Name */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: clr.topText }}>{p.name}</span>
                          <span style={{ fontSize: '0.73rem', color: clr.muted }}>
                            {[p.age && `${p.age} yrs`, p.gender].filter(Boolean).join(' · ')}
                            {last?.brief ? ` · ${last.brief.slice(0, 28)}${last.brief.length > 28 ? '…' : ''}` : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: clr.text, fontWeight: 500 }}>{last ? timeAgo(last.created_at) : '—'}</div>
                        <div style={{ fontSize: '0.8rem', color: clr.text, fontWeight: 500 }}>{p.district || '—'}</div>
                        <div><PriorityBadge severity={p.latestSeverity} /></div>
                        <div><SeverityPill severity={p.latestSeverity} /></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="del-btn"
                            onClick={e => handleDeletePatient(e, p.id)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${clr.glassBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr.muted, transition: 'all 0.15s' }}>
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

          {/* BOARD VIEW */}
          {viewTab === 'Board' && groups.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {groups.map(group => (
                <div key={group.key} style={{ ...glassCard, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: clr.groupHeader, borderBottom: `1px solid ${clr.divider}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: group.dot, boxShadow: `0 0 6px ${group.dot}` }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: clr.topText }}>{group.label}</span>
                    <span style={{ fontWeight: 500, color: clr.muted, fontSize: '0.8125rem' }}>({group.patients.length})</span>
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.patients.map(p => {
                      const last = p.triage_records?.[0]
                      return (
                        <div key={p.id} className="row-btn"
                          onClick={() => handlePatientCardClick(p)}
                          style={{
                            padding: '0.75rem', borderRadius: 10,
                            border: `1px solid ${clr.divider}`,
                            background: clr.btnGlass,
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: clr.topText, marginBottom: 3 }}>{p.name}</div>
                          <div style={{ fontSize: '0.73rem', color: clr.muted, marginBottom: 8 }}>{[p.age && `${p.age} yrs`, p.gender, p.district].filter(Boolean).join(' · ')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <SeverityPill severity={p.latestSeverity} />
                            <span style={{ fontSize: '0.68rem', color: clr.muted }}>{last ? timeAgo(last.created_at) : ''}</span>
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
              <button onClick={() => setShowCount(c => c + 50)} style={{
                padding: '0.625rem 1.5rem', borderRadius: 9,
                border: `1px solid ${clr.accentBorder}`,
                color: clr.accent, background: clr.accentSoft,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s',
              }}>
                Load more ({patientResults.length - showCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}