import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  {
    path: '/home',
    label: 'Dashboard',
    odia: 'ଡ୍ୟାଶବୋର୍ଡ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/patient',
    label: 'Patient Triage',
    odia: 'ରୋଗୀ ଟ୍ରାଏଜ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: '/chat',
    label: 'AI Chat',
    odia: 'AI ଚ୍ୟାଟ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: '/isl',
    label: 'ISL Sign Language',
    odia: 'ସଙ୍କେତ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/>
        <path d="M6 8h12l1 8H5L6 8z"/>
        <path d="M9 8V5M12 8V4M15 8V5"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  function go(path) {
    navigate(path)
    setOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
    setOpen(false)
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        style={{
          position: 'fixed',
          top: 12,
          left: 14,
          zIndex: 500,
          width: 42,
          height: 42,
          borderRadius: 10,
          background: 'var(--color-primary)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          boxShadow: '0 2px 10px rgba(15,110,86,0.4)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
        <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
        <span style={{ width: 18, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 600,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 270,
          zIndex: 700,
          background: 'var(--color-surface)',
          boxShadow: '6px 0 30px rgba(0,0,0,0.18)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
          padding: '1.5rem 1.25rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="12" fill="rgba(255,255,255,0.2)" />
              <path d="M10 26h6l4-8 6 16 4-12 3 6h9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2 }}>Swasthya Setu</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontFamily: "'Noto Sans Oriya', sans-serif" }}>ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 8,
              padding: 6, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Section label */}
        <div style={{ padding: '1.25rem 1.25rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-muted)' }}>
          Features
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.8125rem 0.875rem',
                  borderRadius: 10,
                  border: 'none',
                  marginBottom: 4,
                  background: active ? 'rgba(15,110,86,0.1)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', fontFamily: "'Noto Sans Oriya', sans-serif", color: 'var(--color-text-muted)', fontWeight: 400 }}>
                    {item.odia}
                  </div>
                </div>
                {active && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '0.75rem 0.875rem',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-red)',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-red-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout / ଲଗ ଆଉଟ
          </button>
          <div style={{ padding: '0.5rem 0.875rem 0', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Swasthya Setu v1.0 · ASHA Worker Tool
          </div>
        </div>
      </aside>
    </>
  )
}
