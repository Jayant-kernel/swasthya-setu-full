import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProfileOverlay from './ProfileOverlay.jsx'

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

/* ── Tiny SVG icons ── */
function SearchIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

/**
 * DashboardLayout — shared sidebar + topbar shell.
 *
 * Props:
 *   children       — the main page content
 *   topbarContent  — optional JSX to inject into the top bar (e.g. patient badge)
 *   contentStyle   — extra style overrides for the scrollable content area
 */
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
      style={{
        transition: 'r 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), fill 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
      }}
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
  const [showProfile, setShowProfile] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  /* Theme sync */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  /* Show profile if name is missing */
  useEffect(() => {
    if (user && (!user.full_name || !user.location)) setShowProfile(true)
  }, [user])

  const isDark = theme === 'dark'

  const clr = {
    bg: isDark
      ? 'linear-gradient(135deg, #0f172a 0%, #172554 40%, #1e3a8a 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f0fbf5 100%)', // Almost white with a tiny hint of green
    surface: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(209, 250, 229, 0.4)',
    blur: 'blur(24px) saturate(150%)',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.2)',
    borderSolid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.35)',

    topText: isDark ? '#f8fafc' : '#022c22',
    topMuted: isDark ? '#cbd5e1' : '#047857',

    text: isDark ? '#f8fafc' : '#0f172a',
    muted: isDark ? '#cbd5e1' : '#475569',

    activeBg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'linear-gradient(135deg, #065f46, #064e3b)',
    activeShadow: isDark ? 'inset 0 0 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(6, 78, 59, 0.3)',
    activeBorder: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(6, 78, 59, 0.6)',
    activeText: isDark ? '#60a5fa' : '#ffffff',

    iconBg: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.15)',
    iconColor: isDark ? '#93c5fd' : '#ffffff',

    hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 185, 129, 0.15)',

    primaryBg: isDark ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #10b981, #059669)',
    primaryShadow: isDark ? '0 4px 14px rgba(37, 99, 235, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)',
    primaryColor: isDark ? '#3b82f6' : '#10b981',

    glassBg: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.45)',
    glassBlur: 'blur(12px)',
    glassGlow: isDark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 16px rgba(16, 185, 129, 0.25)', // slight greener tint glow
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', fontFamily: "'Inter','Noto Sans',sans-serif", background: clr.bg, color: clr.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${clr.border}; border-radius: 99px; }
        .dl-nav-btn:hover  { background: ${clr.hover} !important; }
        .dl-action:hover   { background: ${clr.hover} !important; }
        .dl-primary:hover  { background: #2563eb !important; }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: sidebarOpen ? 220 : 0, minWidth: sidebarOpen ? 220 : 0,
        overflow: 'hidden', flexShrink: 0,
        background: clr.surface,
        backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur,
        borderRight: `1px solid ${clr.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ padding: '1.25rem 1rem 0.875rem', borderBottom: `1px solid ${clr.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0F6E56,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '1rem' }}>🏥</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: clr.topText, letterSpacing: '-0.02em' }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.65rem', color: clr.topMuted, fontWeight: 500 }}>ASHA Dashboard</div>
              </div>
            </div>
            {/* The new "downward arrow" dropdown button */}
            <button className="dl-action" onClick={() => setSidebarOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #065f46', background: isDark ? 'linear-gradient(135deg,#065f46,#047857)' : 'linear-gradient(135deg,#065f46,#0f9f6e)', boxShadow: '0 2px 10px rgba(6, 95, 70, 0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', color: '#fff' }}>
              <ChevronDownIcon />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ padding: '0.75rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: clr.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>Menu</div>

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
                    cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = clr.hover }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${clr.border}` }}>
            <button className="dl-nav-btn"
              onClick={() => setShowProfile(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#0F6E56,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: clr.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.6875rem', color: clr.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.employee_id}</div>
              </div>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          background: clr.surface,
          backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur,
          borderBottom: `1px solid ${clr.border}`,
          padding: '0 1.25rem', height: 60,
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
          position: 'relative', zIndex: 10
        }}>
          {/* Left wrapper */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Re-expand Sidebar Button */}
            {!sidebarOpen && (
              <button className="dl-action" onClick={() => setSidebarOpen(true)}
                style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #065f46', background: isDark ? 'linear-gradient(135deg,#065f46,#047857)' : 'linear-gradient(135deg,#065f46,#0f9f6e)', boxShadow: '0 2px 12px rgba(6, 95, 70, 0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', color: '#fff' }}>
                <HamburgerIcon />
              </button>
            )}

            {/* Optional page-specific content (e.g. patient badge in chat) */}
            {topbarContent}
          </div>

          {/* Search — only on non-mobile */}
          <div style={{ width: '100%', maxWidth: 280, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: clr.topMuted, pointerEvents: 'none' }}><SearchIcon /></span>
            <input placeholder="Search patients…"
              style={{
                width: '100%', height: 34, paddingLeft: '2rem', paddingRight: '0.625rem',
                borderRadius: 8, border: `1px solid ${clr.borderSolid}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                color: clr.topText, fontSize: '0.8125rem', outline: 'none',
                boxShadow: isDark ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : '0 2px 6px rgba(0,0,0,0.04)', transition: 'all 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = isDark ? '#3b82f6' : '#10b981'}
              onBlur={e => e.target.style.borderColor = clr.borderSolid}
            />
          </div>

          {/* Right wrapper */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {/* Theme */}
            <button
              className="dl-action"
              aria-label="Toggle theme"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)'}
              onMouseLeave={(e) => { e.currentTarget.style.background = clr.glassBg; e.currentTarget.style.transform = 'scale(1)' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                width: 48, height: 36, borderRadius: '50%',
                border: `1px solid ${clr.borderSolid}`,
                background: clr.glassBg,
                backdropFilter: clr.glassBlur, WebkitBackdropFilter: clr.glassBlur,
                boxShadow: clr.glassGlow,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                flexShrink: 0
              }}
            >
              <ThemeMorphIcon isDark={isDark} color={clr.topText} idSuffix="dash" />
            </button>

            {/* Bell */}
            <button className="dl-action"
              style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${clr.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr.topMuted, position: 'relative', flexShrink: 0, transition: 'all 0.15s' }}>
              <BellIcon />
            </button>

            {/* New Patient CTA */}
            <button className="dl-primary" onClick={() => navigate('/patient')}
              style={{ height: 34, padding: '0 0.875rem', borderRadius: 8, border: `1px solid rgba(255,255,255,0.15)`, background: clr.primaryBg, color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, transition: 'all 0.15s', boxShadow: clr.primaryShadow }}>
              + New Patient
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', ...contentStyle }}>
          {children}
        </div>
      </div>

      {showProfile && <ProfileOverlay onClose={() => setShowProfile(false)} />}
    </div>
  )
}
