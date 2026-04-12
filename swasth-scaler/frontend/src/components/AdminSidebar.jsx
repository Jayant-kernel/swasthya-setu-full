import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext.jsx'
import { HomeIcon, MapIcon, GlobeIcon, LogoutIcon } from '../pages/admin/AdminIcons'

export default function AdminSidebar({ isHovered, setIsHovered }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { isDark } = useTheme()

  const g = {
    cardBg: 'var(--g-card-bg)',
    divider: 'var(--g-divider)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    accent: 'var(--g-accent)',
    blur: 'var(--g-blur)'
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHovered ? 260 : 80,
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
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', width: 260 }}>
        <div style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: g.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Swasthya Setu</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4, letterSpacing: '0.05em' }}>ADMIN PORTAL</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 0.75rem', width: 260 }}>
        <div onClick={() => navigate('/dashboard/admin')} className={`nav-link ${isActive('/dashboard/admin') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <HomeIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Overview</span>
        </div>
        <div onClick={() => navigate('/dashboard/admin/analytics')} className={`nav-link ${isActive('/dashboard/admin/analytics') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <ActivityIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Analytics</span>
        </div>
        <div onClick={() => navigate('/dashboard/admin/map')} className={`nav-link ${isActive('/dashboard/admin/map') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <MapIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>National Map</span>
        </div>
      </nav>

      <div style={{ padding: '1rem', borderTop: `1px solid ${g.divider}`, width: 260 }}>
        <div onClick={() => navigate('/dashboard/dmo')} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 8, border: `1px dashed ${g.divider}` }}>
          <span>💼</span> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>DMO Dashboard</span>
        </div>
        <div onClick={() => { logout(); navigate('/') }} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer' }}>
          <LogoutIcon /> <span style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>Logout</span>
        </div>
      </div>
    </aside>
  )
}
