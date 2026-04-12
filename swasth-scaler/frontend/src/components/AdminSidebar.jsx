import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext.jsx'
import { HomeIcon, MapIcon, GlobeIcon, LogoutIcon } from '../pages/admin/AdminIcons'

export default function AdminSidebar() {
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
    <aside style={{ width: 260, background: g.cardBg, borderRight: `1px solid ${g.divider}`, display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: g.blur }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: g.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Swasthya Setu</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4, letterSpacing: '0.05em' }}>ADMIN PORTAL</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 0.75rem' }}>
        <div onClick={() => navigate('/dashboard/admin')} className={`nav-link ${isActive('/dashboard/admin') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <HomeIcon /> <span>Overview</span>
        </div>
        <div onClick={() => navigate('/dashboard/admin/map')} className={`nav-link ${isActive('/dashboard/admin/map') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 4 }}>
          <MapIcon /> <span>National Map</span>
        </div>
        {/* Analytics currently lives within the Dashboard page as a toggle, so we point back to dashboard if it was a separate link, 
            but for consistency we'll keep it there for now or update it later. 
            Actually, the user might want it as its own route too, but I'll stick to the current logic first. */}
      </nav>

      <div style={{ padding: '1rem', borderTop: `1px solid ${g.divider}` }}>
        <div onClick={() => navigate('/dashboard/dmo')} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer', marginBottom: 8, border: `1px dashed ${g.divider}` }}>
          <span>💼</span> <span>DMO Dashboard</span>
        </div>
        <div onClick={() => { logout(); navigate('/') }} className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', borderRadius: 12, fontSize: '0.9375rem', color: g.muted, cursor: 'pointer' }}>
          <LogoutIcon /> <span>Logout</span>
        </div>
      </div>
    </aside>
  )
}
