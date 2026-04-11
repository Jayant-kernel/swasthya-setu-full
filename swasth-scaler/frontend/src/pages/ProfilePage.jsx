import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../images/logo/logo.png'

/* ─── Icons (same as HomePage) ─────────────────────────────── */
const GridIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const PatientIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
  </svg>
)
const ChatIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const SearchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ChevRight = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevDown = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const MenuBars = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const EditIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const LogoutIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const TrashIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const CameraIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]



/* ═══════════════════════════════════════════════════════════
   ProfilePage
   ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser, logout } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isExpanded = isMobile ? sidebarOpen : isHovered
  const sidebarWidth = isMobile ? (sidebarOpen ? 220 : 0) : (isHovered ? 220 : 72)

  // Profile state
  const [user, setUser] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [forceOnboard, setForceOnboard] = useState(false)
  const [fullName, setFullName] = useState('')
  const [location2, setLocation2] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    async function loadProfile() {
      if (!authUser) { navigate('/login/asha'); return }
      setUser(authUser)
      const savedName = authUser.full_name || ''
      const savedLoc = authUser.location || ''
      setFullName(savedName)
      setLocation2(savedLoc)
      if (!savedName || !savedLoc) { setForceOnboard(true); setIsEditing(true) }
      if (authUser.avatar_b64) setAvatar(authUser.avatar_b64)
      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setHistory(await res.json())
      } catch (err) { console.error('Failed to load history', err) }
      setLoading(false)
    }
    loadProfile()
  }, [authUser, navigate])

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 250, canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
        else { if (h > MAX) { w *= MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setAvatar(dataUrl)
        const token = localStorage.getItem('access_token')
        fetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar_b64: dataUrl })
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile() {
    if (!fullName.trim() || !location2.trim()) { alert('Name and Location are required.'); return }
    setSaveLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      await fetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), location: location2.trim() })
      })
      const updated = { ...user, full_name: fullName.trim(), location: location2.trim() }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setIsEditing(false); setForceOnboard(false)
    } catch (err) { alert('Failed to save: ' + err.message) }
    finally { setSaveLoading(false) }
  }

  async function handleLogout() { await logout(); navigate('/') }

  async function handleDeleteAccount() {
    if (!window.confirm('Delete your account? All patient history will be permanently erased. This cannot be undone.')) return
    try {
      if (user?.id) { localStorage.removeItem(`avatar_${user.id}`); await logout(); navigate('/') }
    } catch (err) { alert('Failed to delete account: ' + err.message) }
  }

  const isDark = theme === 'dark'

  /* ── Glass tokens (identical to HomePage) ── */
  const g = {
    panelBg: isDark ? 'rgba(6,12,30,0.52)' : 'rgba(255,255,255,0.28)',
    panelBdr: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(200,240,220,0.70)',
    blur: 'blur(28px) saturate(170%)',

    cardBg: isDark ? 'rgba(10,18,42,0.48)' : 'rgba(255,255,255,0.26)',
    cardBdr: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)',
    cardShd: isDark
      ? '0 8px 32px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(13,148,136,0.10),inset 0 1px 0 rgba(255,255,255,0.80)',

    insetBg: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.20)',
    rowHover: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.38)',

    text: isDark ? '#ddeeff' : '#0c2a1d',
    muted: isDark ? '#6a84aa' : '#4a7a68',
    label: isDark ? '#3a5070' : '#88b09e',
    accent: '#10b981',
    accentL: isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.16)',
    accentB: isDark ? 'rgba(16,185,129,0.50)' : 'rgba(16,185,129,0.55)',
    accentT: isDark ? '#6ee7b7' : '#065f46',

    navActiveBg: isDark ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.16)',
    navActiveBdr: isDark ? 'rgba(16,185,129,0.50)' : 'rgba(16,185,129,0.55)',
    navActiveT: isDark ? '#6ee7b7' : '#065f46',
    navIconBg: isDark ? 'rgba(16,185,129,0.28)' : 'rgba(16,185,129,0.18)',
    navShd: '0 2px 14px rgba(16,185,129,0.20)',

    hover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(16,185,129,0.09)',
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,230,210,0.55)',
    btn: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.70)',
    btnBdr: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(200,240,220,0.80)',
    btnT: isDark ? '#b8cce4' : '#065f46',
  }

  const panel = { background: g.panelBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur }
  const card = { background: g.cardBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur, border: `1px solid ${g.cardBdr}`, borderRadius: 16, boxShadow: g.cardShd }
  const glassInput = {
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.52)',
    border: `1.5px solid ${g.btnBdr}`, backdropFilter: 'blur(16px)',
    color: g.text, outline: 'none', transition: 'all .2s',
    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
  }

  const sevConfig = {
    red: { label: 'Emergency', color: '#f87171', bg: 'rgba(239,68,68,0.14)', bdr: 'rgba(239,68,68,0.30)' },
    yellow: { label: 'Moderate', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', bdr: 'rgba(245,158,11,0.30)' },
    green: { label: 'Stable', color: '#34d399', bg: 'rgba(52,211,153,0.14)', bdr: 'rgba(52,211,153,0.30)' },
  }

  return (
    <div style={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
      color: g.text,
      background: isDark ? '#04060f' : 'linear-gradient(135deg, #f0fdf8 0%, #dcfce7 40%, #f0fdfa 70%, #f8fff9 100%)',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${g.divider};border-radius:99px;}
        .pp-nav:hover{background:${g.hover}!important;}
        .pp-btn:hover{background:${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)'}!important;}
        .pp-cta:hover{opacity:0.87!important;transform:translateY(-1px)!important;}
        .pp-row:hover{background:${g.rowHover}!important;}
        .pp-input:focus{border-color:${g.accent}!important;box-shadow:0 0 0 3px ${g.accentL}!important;}
        input::placeholder{color:${g.muted};opacity:0.8;}
      `}</style>


      {/* ══ SIDEBAR (exact replica of HomePage sidebar) ══ */}
      <aside 
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        style={{
          ...panel,
          width: sidebarWidth, minWidth: sidebarWidth,
          borderRight: `1px solid ${g.panelBdr}`,
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          transition: 'width .28s cubic-bezier(.4,0,.2,1),min-width .28s cubic-bezier(.4,0,.2,1)',
          position: isMobile ? 'absolute' : 'relative', zIndex: 20,
          height: '100dvh',
          boxShadow: isDark ? '2px 0 24px rgba(0,0,0,0.35)' : '2px 0 20px rgba(13,148,136,0.12)',
        }}
      >
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, overflow: 'hidden', background: g.btn, border: `1px solid ${g.btnBdr}`, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}>
                <img src={logo} alt="logo" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
              </div>
              <div style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: g.text, letterSpacing: '-0.022em', lineHeight: 1.15 }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: g.accent, letterSpacing: '0.09em', textTransform: 'uppercase' }}>ASHA Dashboard</div>
              </div>
            </div>
            {isMobile && (
              <button className="pp-btn" onClick={() => setSidebarOpen(false)} style={{ width: 28, height: 28, borderRadius: 7, background: g.btn, border: `1px solid ${g.btnBdr}`, backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.btnT, transition: 'all .18s', flexShrink: 0 }}>
                <ChevDown />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 0.625rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: g.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem', opacity: isExpanded ? 1 : 0 }}>Menu</div>
            {NAV_ITEMS.map(({ id, label, Icon, path }) => {
              const on = location.pathname.startsWith(path)
              return (
                <button key={id} className="pp-nav" onClick={() => navigate(path)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.625rem', borderRadius: 10, marginBottom: 3,
                  background: on ? g.navActiveBg : 'transparent',
                  border: on ? `1px solid ${g.navActiveBdr}` : '1px solid transparent',
                  boxShadow: on ? g.navShd : 'none',
                  color: on ? g.navActiveT : g.text, fontWeight: on ? 700 : 500, fontSize: '0.875rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .18s',
                  backdropFilter: on ? 'blur(8px)' : 'none',
                }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = g.hover }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? g.navIconBg : 'transparent', color: on ? g.navActiveT : 'inherit', transition: 'all .18s' }}>
                    <Icon active={on} />
                  </div>
                  <span style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>{label}</span>
                  {on && isExpanded && <ChevRight />}
                </button>
              )
            })}
          </nav>

          {/* User (active state since we're on /profile) */}
          <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${g.divider}` }}>
            <div style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.375rem', borderRadius: 9,
              background: g.navActiveBg, border: `1px solid ${g.navActiveBdr}`,
              boxShadow: g.navShd,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#0d9488,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.40)' }}>
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{(authUser?.full_name || authUser?.employee_id || 'A')[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600, fontSize: '0.79rem', color: g.navActiveT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.64rem', color: g.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser?.employee_id}</div>
              </div>
              {isExpanded && <ChevRight />}
            </div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 5 }}>

        {/* ── Topbar (exact replica of HomePage topbar) ── */}
        <header style={{
          ...panel,
          borderBottom: `1px solid ${g.panelBdr}`,
          height: 62, flexShrink: 0,
          display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '0.75rem',
          position: 'relative', zIndex: 10,
          boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.30)' : '0 2px 16px rgba(13,148,136,0.10)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {(isMobile || !isExpanded) && (
              <button className="pp-btn" onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 9, background: g.btn, border: `1px solid ${g.btnBdr}`, backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.btnT, transition: 'all .18s', flexShrink: 0 }}>
                <MenuBars />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: g.muted }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>Dashboard</span>
              <span style={{ opacity: 0.5 }}>›</span>
              <span style={{ color: g.text, fontWeight: 600 }}>Profile</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: g.muted, pointerEvents: 'none' }}><SearchIcon /></span>
              <input placeholder="Search patients…" style={{ ...glassInput, width: '100%', height: 36, paddingLeft: '2.1rem', paddingRight: '2.75rem', borderRadius: 10, fontSize: '0.845rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                onFocus={e => { e.target.style.borderColor = g.accent; e.target.style.boxShadow = `0 0 0 3px ${g.accentL}` }}
                onBlur={e => { e.target.style.borderColor = g.btnBdr; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
              />
              <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', fontWeight: 700, color: g.muted, background: g.btn, border: `1px solid ${g.btnBdr}`, padding: '2px 5px', borderRadius: 5, pointerEvents: 'none', backdropFilter: 'blur(8px)' }}>⌘K</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button className="pp-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{ width: 36, height: 36, borderRadius: '50%', background: g.btn, border: `1px solid ${g.btnBdr}`, backdropFilter: 'blur(12px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.btnT, transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="pp-cta" onClick={() => navigate('/patient')} style={{ height: 36, padding: '0 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0d9488 0%,#10b981 100%)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', fontWeight: 700, fontSize: '0.845rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 14px rgba(16,185,129,0.38)', transition: 'all .2s', letterSpacing: '-0.01em' }}>
              + New Patient
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.875rem', color: g.muted }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${g.cardBdr}`, borderTopColor: g.accent, borderRadius: '50%', animation: 'pp-spin 0.8s linear infinite' }} />
              <style>{`@keyframes pp-spin{to{transform:rotate(360deg)}}`}</style>
              Loading profile…
            </div>
          ) : (
            <>
              {/* ── Profile Header Card ── */}
              <div style={{ ...card, padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: 88, height: 88, borderRadius: '50%', background: g.insetBg, border: `3px solid ${g.cardBdr}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 0 0 4px ${g.accentL}` }}
                      title="Change photo"
                    >
                      {avatar
                        ? <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '2.25rem' }}>👩‍⚕️</span>
                      }
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: g.accent, border: `2px solid ${g.cardBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.5)' }}
                    ><CameraIcon /></button>
                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                  </div>

                  {/* Name / edit form */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {!isEditing ? (
                      <>
                        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: g.text, letterSpacing: '-0.025em' }}>
                          {user?.full_name || 'Set your name'}
                        </h1>
                        <div style={{ fontSize: '0.875rem', color: g.accent, fontWeight: 600, marginBottom: '0.25rem' }}>Healthcare Provider</div>
                        {user?.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: g.muted, marginBottom: '0.25rem' }}>
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {user.location}
                          </div>
                        )}
                        {user?.employee_id && <div style={{ fontSize: '0.75rem', color: g.label, marginBottom: '1rem' }}>ID: {user.employee_id}</div>}
                        {!forceOnboard && (
                          <button
                            onClick={() => setIsEditing(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.125rem', borderRadius: 99, background: g.accentL, border: `1px solid ${g.accentB}`, color: g.accentT, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all .18s', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(16,185,129,0.32)' : 'rgba(16,185,129,0.24)'}
                            onMouseLeave={e => e.currentTarget.style.background = g.accentL}
                          >
                            <EditIcon /> Edit Profile
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: g.text, marginBottom: 3 }}>
                          {forceOnboard ? 'Complete your profile' : 'Edit Profile'}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: g.muted, marginBottom: '1.25rem' }}>
                          {forceOnboard ? 'Required to serve patients' : 'Update your details below'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Full Name</label>
                            <input
                              className="pp-input"
                              value={fullName} onChange={e => setFullName(e.target.value)}
                              placeholder="E.g., Anjali Sharma"
                              style={{ ...glassInput, width: '100%', padding: '0.625rem 0.875rem', borderRadius: 10, fontSize: '0.9rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Location / Village</label>
                            <input
                              className="pp-input"
                              value={location2} onChange={e => setLocation2(e.target.value)}
                              placeholder="E.g., Pune District"
                              style={{ ...glassInput, width: '100%', padding: '0.625rem 0.875rem', borderRadius: 10, fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          {!forceOnboard && (
                            <button
                              onClick={() => { setIsEditing(false); setFullName(user?.full_name || ''); setLocation2(user?.location || '') }}
                              style={{ padding: '0.5rem 1.125rem', borderRadius: 99, background: 'transparent', border: `1px solid ${g.cardBdr}`, color: g.muted, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                            >Cancel</button>
                          )}
                          <button
                            onClick={handleSaveProfile} disabled={saveLoading}
                            style={{ padding: '0.5rem 1.375rem', borderRadius: 99, background: 'linear-gradient(135deg,#0d9488,#10b981)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(16,185,129,0.38)', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                          >
                            {saveLoading ? 'Saving…' : 'Save Details'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Meta grid (right side) */}
                  {!isEditing && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem 2rem', alignSelf: 'center' }}>
                      {[
                        { label: 'Status', value: 'Active', accent: true },
                        { label: 'Department', value: 'Primary Care' },
                        { label: 'Employee ID', value: user?.employee_id || '—' },
                        { label: 'Total Records', value: `${history.length} Visits` },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: m.accent ? g.accent : g.text }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Patient History Table ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text, letterSpacing: '-0.02em' }}>
                    Patient History
                    <span style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 500, marginLeft: 8 }}>रुग्ण इतिहास</span>
                  </h2>
                  <span style={{ background: g.accentL, color: g.accentT, padding: '0.25rem 0.875rem', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: `1px solid ${g.accentB}` }}>
                    {history.length} Visits
                  </span>
                </div>

                <div style={{ ...card, overflow: 'hidden' }}>
                  {history.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }}>📂</div>
                      <div style={{ fontWeight: 700, color: g.text, marginBottom: 4 }}>No patients triaged yet.</div>
                      <div style={{ fontSize: '0.875rem' }}>Your submitted records will appear here.</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${g.divider}`, background: g.insetBg, backdropFilter: 'blur(8px)' }}>
                          {['Patient', 'Age / Gender', 'District', 'Severity', 'Date'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1.375rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((record, i) => {
                          const cfg = sevConfig[record.severity] || sevConfig.green
                          const date = new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          return (
                            <tr
                              key={record.id}
                              className="pp-row"
                              style={{ borderBottom: i < history.length - 1 ? `1px solid ${g.divider}` : 'none', transition: 'background .12s', cursor: 'default' }}
                            >
                              <td style={{ padding: '0.875rem 1.375rem', fontWeight: 700, fontSize: '0.875rem', color: g.text }}>{record.patient_name}</td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.muted }}>{record.age}y · {record.gender}</td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.text }}>{record.district}</td>
                              <td style={{ padding: '0.875rem 1.375rem' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.bdr}`, fontSize: '0.71rem', fontWeight: 700, color: cfg.color, backdropFilter: 'blur(8px)' }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
                                  {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.muted, whiteSpace: 'nowrap' }}>{date}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Account Actions ── */}
              {!forceOnboard && (
                <div style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: g.text, marginBottom: 2 }}>Account Actions</div>
                    <div style={{ fontSize: '0.8125rem', color: g.muted }}>Manage your session and account data</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.25rem', borderRadius: 10, background: g.btn, border: `1px solid ${g.btnBdr}`, color: g.btnT, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all .18s', backdropFilter: 'blur(12px)', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = isDark ? '#fff' : '#0c2a1d' }}
                      onMouseLeave={e => { e.currentTarget.style.background = g.btn; e.currentTarget.style.color = g.btnT }}
                    >
                      <LogoutIcon /> Sign Out
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.25rem', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all .18s', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; e.currentTarget.style.color = '#f87171' }}
                    >
                      <TrashIcon /> Delete Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}