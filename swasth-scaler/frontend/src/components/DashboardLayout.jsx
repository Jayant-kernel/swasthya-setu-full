import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProfileOverlay from './ProfileOverlay.jsx'
import logo from '../images/logo/logo.png'

/* ── Icon helpers ── */
function GridIcon({ active }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
function PatientIcon({ active }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  )
}
function ChatIcon({ active }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]

function SearchIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function HamburgerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const ThemeMorphIcon = ({ isDark, color, idSuffix }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{
      color: color,
      transform: isDark ? 'rotate(-45deg)' : 'rotate(0deg)',
      transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
    }}
  >
    <mask id={`moon-mask-${idSuffix}`}>
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <circle
        cx={isDark ? "15" : "28"}
        cy={isDark ? "6" : "-8"}
        r="8" fill="black"
        style={{ transition: 'cx 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' }}
      />
    </mask>
    <circle
      cx="12" cy="12"
      r={isDark ? "9" : "5"}
      mask={`url(#moon-mask-${idSuffix})`}
      fill={isDark ? "currentColor" : "transparent"}
      style={{ transition: 'r 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), fill 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' }}
    />
    <g style={{
      transform: isDark ? 'scale(0)' : 'scale(1)',
      transformOrigin: '12px 12px',
      transition: 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
      opacity: isDark ? 0 : 1
    }}>
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  </svg>
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

  // ── Glass tokens ──────────────────────────────────────────
  const clr = {
    // Background blobs bleed through everything
    bgBase: isDark
      ? '#0a0f1e'
      : '#e8f5f0',

    // Glass surfaces — nearly clear
    glass: isDark
      ? 'rgba(10, 20, 40, 0.35)'
      : 'rgba(255, 255, 255, 0.22)',
    glassBorder: isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.55)',
    glassBlur: 'blur(28px) saturate(180%)',

    // Deeper glass for sidebar (slightly more opaque)
    sideGlass: isDark
      ? 'rgba(8, 16, 36, 0.45)'
      : 'rgba(255, 255, 255, 0.28)',
    sideGlassBorder: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.6)',

    // Text
    text: isDark ? '#f0f4ff' : '#0d2b1e',
    muted: isDark ? '#8899bb' : '#4a7c6a',
    topText: isDark ? '#e8f0ff' : '#0a2318',
    topMuted: isDark ? '#7080a0' : '#3d6b58',

    // Accent
    accent: '#20c997',
    accentSoft: isDark ? 'rgba(32, 201, 151, 0.2)' : 'rgba(32, 201, 151, 0.15)',
    accentBorder: isDark ? 'rgba(32, 201, 151, 0.4)' : 'rgba(32, 201, 151, 0.5)',

    // Active nav
    activeBg: isDark ? 'rgba(32, 201, 151, 0.18)' : 'rgba(32, 201, 151, 0.2)',
    activeBorder: isDark ? 'rgba(32, 201, 151, 0.45)' : 'rgba(32, 201, 151, 0.55)',
    activeText: isDark ? '#5eefc4' : '#0a5c3e',
    activeShadow: isDark
      ? 'inset 0 0 16px rgba(32, 201, 151, 0.12), 0 2px 12px rgba(32, 201, 151, 0.15)'
      : 'inset 0 0 16px rgba(32, 201, 151, 0.08), 0 2px 12px rgba(32, 201, 151, 0.18)',

    iconBg: isDark ? 'rgba(32, 201, 151, 0.2)' : 'rgba(32, 201, 151, 0.18)',
    iconColor: isDark ? '#5eefc4' : '#0a5c3e',

    hover: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(32, 201, 151, 0.1)',

    // Dividers
    divider: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.5)',

    // Button
    btnGlass: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)',
    btnBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)',
    btnColor: isDark ? '#c8d8f0' : '#0a5c3e',
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
        .dl-nav-btn:hover { background: ${clr.hover} !important; }
        .dl-action:hover  { background: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)'} !important; }
        .dl-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(32,201,151,0.4) !important; }
        input::placeholder { color: ${clr.muted}; opacity: 0.7; }
        select option { background: ${isDark ? '#0d1a2e' : '#f0faf5'}; color: ${clr.text}; }
      `}</style>

      {/* ── Background blob layer ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Teal blob top-left */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(20,184,166,0.28) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        {/* Lavender blob top-right */}
        <div style={{
          position: 'absolute', top: '5%', right: '-15%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }} />
        {/* Mint blob center-bottom */}
        <div style={{
          position: 'absolute', bottom: '-10%', left: '30%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(110,231,183,0.38) 0%, transparent 70%)',
          filter: 'blur(65px)',
        }} />
        {/* Deep teal accent bottom-left */}
        <div style={{
          position: 'absolute', bottom: '10%', left: '-5%',
          width: '30vw', height: '30vw', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)',
          filter: 'blur(55px)',
        }} />
      </div>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: sidebarOpen ? 220 : 0, minWidth: sidebarOpen ? 220 : 0,
        overflow: 'hidden', flexShrink: 0,
        background: clr.sideGlass,
        backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
        borderRight: `1px solid ${clr.sideGlassBorder}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{
            padding: '1.25rem 1rem 0.875rem',
            borderBottom: `1px solid ${clr.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isDark ? 'rgba(32,201,151,0.12)' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${clr.glassBorder}`,
                backdropFilter: 'blur(8px)',
                filter: 'drop-shadow(0 0 12px rgba(32,201,151,0.35))'
              }}>
                <img src={logo} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: clr.topText, letterSpacing: '-0.025em' }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.625rem', color: clr.accent, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ASHA Dashboard</div>
              </div>
            </div>
            <button className="dl-action" onClick={() => setSidebarOpen(o => !o)} style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${clr.btnBorder}`,
              background: clr.btnGlass,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s', color: clr.btnColor,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <ChevronDownIcon />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ padding: '0.875rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, color: clr.muted,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0 0.5rem', marginBottom: '0.5rem'
            }}>Menu</div>

            {NAV_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <button key={item.id} className="dl-nav-btn"
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
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: isActive ? 'blur(8px)' : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = clr.hover }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? clr.iconBg : 'transparent',
                    color: isActive ? clr.iconColor : 'inherit',
                    transition: 'all 0.2s'
                  }}>
                    <item.Icon active={isActive} />
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRightIcon />}
                </button>
              )
            })}
          </nav>

          {/* User */}
          <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${clr.divider}` }}>
            <button className="dl-nav-btn"
              onClick={() => navigate('/profile')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d9488, #20c997)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 0 0 2px rgba(32,201,151,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>
                  {(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: clr.topText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || 'ASHA Worker'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: clr.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.employee_id}
                </div>
              </div>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 5 }}>

        {/* Top bar */}
        <div style={{
          background: clr.glass,
          backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
          borderBottom: `1px solid ${clr.glassBorder}`,
          padding: '0 1.25rem', height: 60,
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
          position: 'relative', zIndex: 10,
        }}>
          {/* Left */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!sidebarOpen && (
              <button className="dl-action" onClick={() => setSidebarOpen(true)} style={{
                width: 36, height: 36, borderRadius: 9,
                border: `1px solid ${clr.btnBorder}`,
                background: clr.btnGlass,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s', color: clr.btnColor,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
              }}>
                <HamburgerIcon />
              </button>
            )}
            {topbarContent}
          </div>

          {/* Search */}
          <div style={{ width: '100%', maxWidth: 280, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: clr.muted, pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input placeholder="Search patients…" style={{
              width: '100%', height: 34, paddingLeft: '2rem', paddingRight: '0.625rem',
              borderRadius: 8,
              border: `1px solid ${clr.glassBorder}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              color: clr.topText, fontSize: '0.8125rem', outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
            }}
              onFocus={e => { e.target.style.borderColor = clr.accent; e.target.style.boxShadow = `0 0 0 3px ${clr.accentSoft}` }}
              onBlur={e => { e.target.style.borderColor = clr.glassBorder; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
            />
          </div>

          {/* Right */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {/* Theme toggle */}
            <button className="dl-action" aria-label="Toggle theme"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `1px solid ${clr.btnBorder}`,
                background: clr.btnGlass,
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)', flexShrink: 0
              }}>
              <ThemeMorphIcon isDark={isDark} color={clr.btnColor} idSuffix="dl" />
            </button>

            {/* New Patient CTA */}
            <button className="dl-primary" onClick={() => navigate('/patient')} style={{
              height: 34, padding: '0 0.875rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'linear-gradient(135deg, #0d9488 0%, #20c997 50%, #6366f1 100%)',
              color: '#fff', fontWeight: 700, fontSize: '0.8125rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '0.3rem', flexShrink: 0, transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(32,201,151,0.3)',
              letterSpacing: '0.01em',
            }}>
              + New Patient
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', ...contentStyle }}>
          {children}
        </div>
      </div>
    </div>
  )
}