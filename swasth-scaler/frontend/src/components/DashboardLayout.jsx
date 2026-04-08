import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProfileOverlay from './ProfileOverlay.jsx'

/* ── Nav items ── */
const NAV_ITEMS = [
  { id: 'home',    label: 'Dashboard',     emoji: '⊞',  path: '/home' },
  { id: 'patient', label: 'New Patient',   emoji: '➕', path: '/patient' },
  { id: 'chat',    label: 'AI Chat',       emoji: '💬', path: '/chat' },
  { id: 'isl',     label: 'Sign Language', emoji: '🤟', path: '/isl' },
]

/* ── Tiny SVG icons ── */
function SearchIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
function HamburgerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
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
export default function DashboardLayout({ children, topbarContent, contentStyle = {} }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [showProfile,  setShowProfile]  = useState(false)
  const [theme,        setTheme]        = useState(localStorage.getItem('theme') || 'light')

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
    bg:      isDark ? '#0f1117' : '#f5f6fa',
    surface: isDark ? '#16181f' : '#ffffff',
    border:  isDark ? '#1f2230' : '#e5e7eb',
    text:    isDark ? '#e5e7eb' : '#111827',
    muted:   isDark ? '#6b7280' : '#9ca3af',
    hover:   isDark ? '#1e2030' : '#f3f4f6',
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
        background: clr.surface, borderRight: `1px solid ${clr.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
      }}>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ padding: '1.25rem 1rem 0.875rem', borderBottom: `1px solid ${clr.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0F6E56,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '1rem' }}>🏥</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: clr.text, letterSpacing: '-0.02em' }}>Swasthya Setu</div>
                <div style={{ fontSize: '0.65rem', color: clr.muted, fontWeight: 500 }}>ASHA Dashboard</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '0.75rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: clr.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>Menu</div>

            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.path
              return (
                <button key={item.id} className="dl-nav-btn"
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none',
                    background: isActive ? (isDark ? '#1e2942' : '#eff6ff') : 'transparent',
                    color: isActive ? '#3b82f6' : clr.muted,
                    fontWeight: isActive ? 600 : 500, fontSize: '0.875rem',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.emoji}</span>
                  {item.label}
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
          background: clr.surface, borderBottom: `1px solid ${clr.border}`,
          padding: '0 1.25rem', height: 56,
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
        }}>
          {/* Hamburger */}
          <button className="dl-action" onClick={() => setSidebarOpen(o => !o)}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${clr.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', color: clr.text }}>
            <HamburgerIcon />
          </button>

          {/* Optional page-specific content (e.g. patient badge in chat) */}
          {topbarContent}

          {/* Search — only on non-mobile */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 280 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: clr.muted, pointerEvents: 'none' }}><SearchIcon /></span>
            <input placeholder="Search patients…"
              style={{ width: '100%', height: 32, paddingLeft: '2rem', paddingRight: '0.625rem', borderRadius: 8, border: `1px solid ${clr.border}`, background: isDark ? '#1a1d27' : '#f9fafb', color: clr.text, fontSize: '0.8125rem', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = clr.border}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme */}
          <button className="dl-action" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${clr.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, transition: 'all 0.15s' }}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Bell */}
          <button className="dl-action"
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${clr.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr.muted, position: 'relative', flexShrink: 0, transition: 'all 0.15s' }}>
            <BellIcon />
          </button>

          {/* New Patient CTA */}
          <button className="dl-primary" onClick={() => navigate('/patient')}
            style={{ height: 34, padding: '0 0.875rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0, transition: 'background 0.15s' }}>
            + New Patient
          </button>
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
