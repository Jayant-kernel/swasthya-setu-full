import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../images/logo/logo.png'

/* ── Custom SVG Icons ── */
const ProfileIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
const ActivityIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
)
const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
)
const SettingsIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
)
const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const BellIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('History')
  const [searchFocused, setSearchFocused] = useState(false)

  // Sidebar items
  const NAV_ITEMS = [
    { id: 'profile', label: 'Profile', icon: ProfileIcon },
    { id: 'health', label: 'Health Data', icon: ActivityIcon },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Mock Health Stats
  const HEALTH_STATS = [
    { label: 'Heart Rate', value: '72 bpm', icon: '❤️', trend: '+2%' },
    { label: 'Last Checkup', value: '12 Apr 2026', icon: '🩺', trend: 'On track' },
    { label: 'Health Score', value: '94/100', icon: '🌟', trend: 'Excellent' },
  ]

  const MEDICAL_TABS = ['History', 'Medications', 'Reports']

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'linear-gradient(135deg, #0a192f 0%, #001f3f 30%, #0074d9 70%, #7fdbff 100%)',
      display: 'flex',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0, 116, 217, 0.15) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(127, 219, 255, 0.1) 0%, transparent 70%)', zIndex: 0 }} />

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: 260,
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        zIndex: 10,
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => navigate('/home')}>
          <img src={logo} alt="Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Swasthya Setu</span>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1.25rem', borderRadius: 16,
                background: item.id === 'profile' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                border: item.id === 'profile' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                color: item.id === 'profile' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: item.id === 'profile' ? 700 : 500,
                fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { if(item.id !== 'profile') { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={(e) => { if(item.id !== 'profile') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User context footer */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0F6E56, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {(user?.full_name || 'A')[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.full_name || 'ASHA Worker'}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.employee_id}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        
        {/* Top Navbar */}
        <header style={{
          height: 80, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 3rem',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}><SearchIcon size={18} /></span>
            <input 
              type="text" 
              placeholder="Search health records..." 
              style={{
                width: '100%', height: 44,
                padding: '0 1rem 0 3rem',
                background: searchFocused ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                border: searchFocused ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12, outline: 'none', color: '#fff', fontSize: '0.875rem',
                transition: 'all 0.3s'
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer' }}><BellIcon size={22} /></button>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0F6E56, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                {(user?.full_name || 'A')[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
          
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Card */}
            <div style={{
              ...glassStyle,
              padding: '2.5rem',
              display: 'flex', alignItems: 'center', gap: '3rem',
              position: 'relative', overflow: 'hidden'
            }} className="glass-card">
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  width: 140, height: 140, borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #0F6E56, #10b981)',
                  padding: 4, boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    {user?.avatar_b64 ? <img src={user.avatar_b64} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : (user?.full_name || 'A')[0]}
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: '50%', background: '#10b981', border: '3px solid #001f3f' }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{user?.full_name || 'ASHA Worker'}</h1>
                    <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Registered ASHA • {user?.location || 'Pune District'}</p>
                    <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 10, display: 'inline-block', fontSize: '0.875rem' }}>
                      ID: <span style={{ fontWeight: 700 }}>{user?.employee_id}</span>
                    </div>
                  </div>
                  <button 
                    style={{ 
                      padding: '0.75rem 1.5rem', borderRadius: 12, 
                      background: 'rgba(255, 255, 255, 0.12)', 
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Edit Profile
                  </button>
                </div>
                <p style={{ marginTop: '1.5rem', maxWidth: 600, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
                  Dedicated community health worker helping bridge the gap in rural healthcare since 2021. Specializing in maternal care and digital health record management.
                </p>
              </div>
            </div>

            {/* Health Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {HEALTH_STATS.map(stat => (
                <div key={stat.label} style={{
                  ...glassStyle,
                  padding: '1.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  transition: 'all 0.3s'
                }} 
                className="glass-card-hover"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 6 }}>{stat.trend}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Detail Tabs Card */}
            <div style={{ ...glassStyle, padding: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem' }}>
                {MEDICAL_TABS.map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '1rem 0',
                      background: 'none', border: 'none',
                      color: activeTab === tab ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                      fontWeight: 700, fontSize: '1rem',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    {tab}
                    {activeTab === tab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#10b981', boxShadow: '0 0 10px #10b981' }} />}
                  </button>
                ))}
              </div>

              <div style={{ minHeight: 200 }}>
                {activeTab === 'History' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Annual Health Screening</div>
                          <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>District General Hospital • Dr. Vivek Kulkarni</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>Completed</div>
                          <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }}>15 Jan 2026</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab !== 'History' && (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)', fontStyle: 'italic' }}>
                    No records found in this category.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  )
}
