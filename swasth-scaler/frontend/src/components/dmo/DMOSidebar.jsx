import React, { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'
import { HomeIcon, MapIcon, LogoutIcon } from '../../pages/admin/AdminIcons'

export default function DMOSidebar({ isHovered, setIsHovered, onLogout, onAdminNav }) {
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
