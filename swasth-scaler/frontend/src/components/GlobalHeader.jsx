import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileOverlay from './ProfileOverlay.jsx'

export default function GlobalHeader({ children, rightSide }) {
  const navigate = useNavigate()
  const [showProfileOverlay, setShowProfileOverlay] = useState(false)

  return (
    <>
      <header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '0.875rem 1.25rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        boxShadow: 'var(--shadow)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '1rem' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F6E56', letterSpacing: '-0.02em' }}>Swasthya Setu</div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>आरोग्य सेतू</div>
          </button>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {rightSide}
          
          <button
            onClick={() => setShowProfileOverlay(true)}
            style={{ 
              width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', 
              border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: '#111', 
              transition: 'transform 0.2s', flexShrink: 0 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Profile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {showProfileOverlay && <ProfileOverlay onClose={() => setShowProfileOverlay(false)} />}
    </>
  )
}
