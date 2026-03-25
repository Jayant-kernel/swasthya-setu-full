import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TEAL = '#0F6E56'

const ITEMS = [
  {
    path: '/home', odia: 'ଘର', label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? TEAL : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    path: '/patient', odia: 'ରୋଗୀ', label: 'Patient',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? TEAL : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        <line x1="12" y1="3" x2="12" y2="5"/>
        <line x1="12" y1="11" x2="12" y2="13"/>
      </svg>
    ),
  },
  {
    path: '/isl', odia: 'ସଙ୍କେତ', label: 'ISL',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? TEAL : '#6b7280'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/>
        <path d="M6 8h12l1 8H5L6 8z"/>
        <path d="M9 8V5M12 8V4M15 8V5"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 64, background: '#fff',
      borderTop: '1px solid #e5e7eb',
      display: 'flex', zIndex: 200,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
    }}>
      {ITEMS.map(item => {
        const active = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, border: 'none', background: 'transparent',
              cursor: 'pointer', minHeight: 64,
              borderTop: active ? `2.5px solid ${TEAL}` : '2.5px solid transparent',
              transition: 'border-color 0.15s',
            }}
          >
            {item.icon(active)}
            <span style={{
              fontSize: '0.6875rem', fontWeight: active ? 700 : 400,
              color: active ? TEAL : '#9ca3af',
              fontFamily: "'Noto Sans Oriya', sans-serif",
              letterSpacing: '0.01em',
            }}>
              {item.odia}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
