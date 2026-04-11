import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../images/logo/logo.png'

/* ─── Icons ──────────────────────────────────────────────────── */
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
const ChevronRight = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronDown = () => (
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

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]

/* ─── Blob background ────────────────────────────────────────── */
const Blobs = ({ isDark }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {/* teal – top-left */}
    <div style={{
      position: 'absolute', top: '-25%', left: '-18%', width: '72vw', height: '72vw', borderRadius: '50%',
      background: isDark
        ? 'radial-gradient(circle, rgba(13,148,136,0.70) 0%, transparent 68%)'
        : 'radial-gradient(circle, rgba(13,148,136,0.75) 0%, transparent 68%)',
      filter: 'blur(90px)'
    }} />
    {/* lavender – top-right */}
    <div style={{
      position: 'absolute', top: '-12%', right: '-22%', width: '62vw', height: '62vw', borderRadius: '50%',
      background: isDark
        ? 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, transparent 68%)'
        : 'radial-gradient(circle, rgba(167,139,250,0.65) 0%, transparent 68%)',
      filter: 'blur(95px)'
    }} />
    {/* mint – bottom-center */}
    <div style={{
      position: 'absolute', bottom: '-22%', left: '22%', width: '68vw', height: '68vw', borderRadius: '50%',
      background: isDark
        ? 'radial-gradient(circle, rgba(16,185,129,0.50) 0%, transparent 68%)'
        : 'radial-gradient(circle, rgba(52,211,153,0.65) 0%, transparent 68%)',
      filter: 'blur(90px)'
    }} />
    {/* cyan – bottom-left */}
    <div style={{
      position: 'absolute', bottom: '8%', left: '-12%', width: '42vw', height: '42vw', borderRadius: '50%',
      background: isDark
        ? 'radial-gradient(circle, rgba(6,182,212,0.40) 0%, transparent 68%)'
        : 'radial-gradient(circle, rgba(6,182,212,0.55) 0%, transparent 68%)',
      filter: 'blur(75px)'
    }} />
    {/* pink – mid-right */}
    <div style={{
      position: 'absolute', top: '38%', right: '-8%', width: '38vw', height: '38vw', borderRadius: '50%',
      background: isDark
        ? 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 68%)'
        : 'radial-gradient(circle, rgba(244,114,182,0.35) 0%, transparent 68%)',
      filter: 'blur(80px)'
    }} />
    {/* dark overlay so blobs read clearly */}
    {isDark && <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,8,22,0.50)' }} />}
  </div>
)

export default function DashboardLayout({ children, topbarContent, contentStyle = {} }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const isDark = theme === 'dark'

  /* Glass tokens – every surface uses these */
  const g = {
    /* panels (sidebar, topbar) — slightly more opaque for readability */
    panelBg: isDark ? 'rgba(6,12,30,0.52)' : 'rgba(255,255,255,0.28)',
    panelBdr: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.62)',
    blur: 'blur(28px) saturate(170%)',

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
    navActiveShd: '0 2px 14px rgba(16,185,129,0.20)',
    navIconBg: isDark ? 'rgba(16,185,129,0.28)' : 'rgba(16,185,129,0.18)',

    hover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(16,185,129,0.09)',
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',

    btn: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.58)',
    btnBdr: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.78)',
    btnT: isDark ? '#b8cce4' : '#065f46',
  }

  const panel = {
    background: g.panelBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
  }

  return (
    <div style={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
      color: g.text,
      background: isDark ? '#04060f' : '#a8e6d4',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${g.divider};border-radius:99px;}
        .dl-nav:hover{background:${g.hover}!important;}
        .dl-btn:hover{background:${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)'}!important;}
        .dl-cta:hover{opacity:0.87!important;transform:translateY(-1px)!important;box-shadow:0 6px 22px rgba(16,185,129,0.45)!important;}
        input::placeholder{color:${g.muted};opacity:0.8;}
        select option{background:${isDark ? '#0a1525' : '#edfaf5'};color:${g.text};}
      `}</style>

      <Blobs isDark={isDark} />

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        ...panel,
        width: sidebarOpen ? 220 : 0,
        minWidth: sidebarOpen ? 220 : 0,
        borderRight: `1px solid ${g.panelBdr}`,
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        transition: 'width .28s cubic-bezier(.4,0,.2,1),min-width .28s cubic-bezier(.4,0,.2,1)',
        position: 'relative', zIndex: 20,
        boxShadow: isDark ? '2px 0 24px rgba(0,0,0,0.35)' : '2px 0 20px rgba(13,148,136,0.12)',
      }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0, overflow: 'hidden',
                background: g.btn, border: `1px solid ${g.btnBdr}`,
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))',
              }}>
                <img src={logo} alt="logo" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: g.text, letterSpacing: '-0.022em', lineHeight: 1.15 }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: g.accent, letterSpacing: '0.09em', textTransform: 'uppercase' }}>ASHA Dashboard</div>
              </div>
            </div>
            <button className="dl-btn" onClick={() => setSidebarOpen(false)} style={{
              width: 28, height: 28, borderRadius: 7,
              background: g.btn, border: `1px solid ${g.btnBdr}`,
              backdropFilter: 'blur(8px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: g.btnT, transition: 'all .18s', flexShrink: 0,
            }}><ChevronDown /></button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 0.625rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: g.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>Menu</div>
            {NAV_ITEMS.map(({ id, label, Icon, path }) => {
              const on = location.pathname.startsWith(path)
              return (
                <button key={id} className="dl-nav" onClick={() => navigate(path)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.625rem', borderRadius: 10, marginBottom: 3,
                  background: on ? g.navActiveBg : 'transparent',
                  border: on ? `1px solid ${g.navActiveBdr}` : '1px solid transparent',
                  boxShadow: on ? g.navActiveShd : 'none',
                  color: on ? g.navActiveT : g.text,
                  fontWeight: on ? 700 : 500, fontSize: '0.875rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .18s',
                  backdropFilter: on ? 'blur(8px)' : 'none',
                }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = g.hover }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? g.navIconBg : 'transparent', color: on ? g.navActiveT : 'inherit', transition: 'all .18s' }}>
                    <Icon active={on} />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {on && <ChevronRight />}
                </button>
              )
            })}
          </nav>

          {/* User */}
          <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${g.divider}` }}>
            <button className="dl-nav" onClick={() => navigate('/profile')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.375rem', borderRadius: 9, border: 'none',
              background: 'transparent', cursor: 'pointer', color: g.text, transition: 'all .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = g.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#0d9488,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.40)' }}>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.64rem', color: g.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.employee_id}</div>
              </div>
              <ChevronRight />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 5 }}>

        {/* Topbar */}
        <header style={{
          ...panel,
          borderBottom: `1px solid ${g.panelBdr}`,
          height: 62, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 1.25rem', gap: '0.75rem',
          position: 'relative', zIndex: 10,
          boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.30)' : '0 2px 16px rgba(13,148,136,0.10)',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!sidebarOpen && (
              <button className="dl-btn" onClick={() => setSidebarOpen(true)} style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: g.btn, border: `1px solid ${g.btnBdr}`,
                backdropFilter: 'blur(12px)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: g.btnT, transition: 'all .18s',
              }}><MenuBars /></button>
            )}
            {topbarContent}
          </div>

          {/* Centre – search */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: g.muted, pointerEvents: 'none' }}><SearchIcon /></span>
              <input placeholder="Search patients…" style={{
                width: '100%', height: 36, paddingLeft: '2.1rem', paddingRight: '2.75rem',
                borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.52)',
                border: `1px solid ${g.btnBdr}`,
                backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                color: g.text, fontSize: '0.845rem', outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all .2s',
              }}
                onFocus={e => { e.target.style.borderColor = g.accent; e.target.style.boxShadow = `0 0 0 3px ${g.accentL}` }}
                onBlur={e => { e.target.style.borderColor = g.btnBdr; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
              />
              <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', fontWeight: 700, color: g.muted, background: g.btn, border: `1px solid ${g.btnBdr}`, padding: '2px 5px', borderRadius: 5, pointerEvents: 'none', backdropFilter: 'blur(8px)' }}>⌘K</span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button className="dl-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: g.btn, border: `1px solid ${g.btnBdr}`,
              backdropFilter: 'blur(12px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: g.btnT, transition: 'all .2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="dl-cta" onClick={() => navigate('/patient')} style={{
              height: 36, padding: '0 1rem', borderRadius: 10,
              background: 'linear-gradient(135deg,#0d9488 0%,#10b981 100%)',
              border: '1px solid rgba(255,255,255,0.28)',
              color: '#fff', fontWeight: 700, fontSize: '0.845rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 14px rgba(16,185,129,0.38)',
              transition: 'all .2s', letterSpacing: '-0.01em',
            }}>+ New Patient</button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, ...contentStyle }}>
          {children}
        </main>
      </div>
    </div>
  )
}