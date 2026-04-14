import React, { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import { HomeIcon, MapIcon, LogoutIcon } from '../../pages/admin/AdminIcons'

export default function DMOSidebar({ isHovered, setIsHovered, onLogout, onAdminNav }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useAuth()
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
      style={{
        width: isHovered ? 240 : 80,
        background: g.cardBg,
        borderRight: `1px solid ${g.divider}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width .28s cubic-bezier(.4,1,0.2,1)',
        overflow: 'hidden',
        backdropFilter: g.blur
      }}
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
        <div onClick={() => navigate('/dashboard/dmo/profile')} className={`nav-link ${currentPath === '/dashboard/dmo/profile' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Profile</span>
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

      {/* User Info Section */}
      <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${g.divider}`, width: 240 }}>
        <button onClick={() => navigate('/dashboard/dmo/profile')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.5rem 0.375rem', borderRadius: 12, border: 'none',
          background: 'transparent', cursor: 'pointer', color: g.text, transition: 'all .15s',
          textAlign: 'left'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--g-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4f46e5,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>
            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'D')[0].toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{user?.full_name || 'DMO Officer'}</div>
            <div style={{ fontSize: '0.66rem', color: g.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>{user?.designation || 'Medical Command'}</span>
              <span>📍 {user?.location || 'Pune District'}</span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  )
}
