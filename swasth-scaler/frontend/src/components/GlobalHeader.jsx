import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileOverlay from './ProfileOverlay.jsx'

export default function GlobalHeader({ children, rightSide }) {
  const navigate = useNavigate()
  const [showProfileOverlay, setShowProfileOverlay] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.classList.add('theme-transition')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <>
      <header style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)', 
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
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>Swasthya Setu</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>आरोग्य सेतू</div>
          </button>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {rightSide}

          <button
            onClick={toggleTheme}
            style={{ 
              position: 'relative', width: 62, height: 32, borderRadius: 32, 
              background: theme === 'light' ? '#e5e7eb' : '#334155', border: '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4,
              transition: 'background 0.3s ease', flexShrink: 0
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <div style={{
              position: 'absolute', width: 24, height: 24, borderRadius: '50%', background: '#fff',
              left: theme === 'light' ? 4 : 32, transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              {theme === 'light' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setShowProfileOverlay(true)}
            style={{ 
              width: 44, height: 44, borderRadius: '50%', background: 'var(--hover-bg)', 
              border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', 
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
