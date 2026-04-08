import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../images/logo/logo.png'

/* ── Custom SVG Icons ── */
const ActivityIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
)
const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
)

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('History')
  const [stats, setStats] = useState({
    patientCount: 0,
    lastPatientTime: 'Checking...',
    rawRecords: []
  })
  const [loading, setLoading] = useState(true)

  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const records = res.ok ? await res.json() : []
      
      // Calculate unique patients
      const patientIds = new Set(records.map(r => r.patient_id).filter(Boolean))
      const count = patientIds.size

      // Find last patient time
      let lastTime = 'No records'
      if (records.length > 0) {
        const sorted = [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const latest = sorted[0].created_at
        lastTime = new Date(latest).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })
      }

      setStats({
        patientCount: count,
        lastPatientTime: lastTime,
        rawRecords: records
      })
    } catch (err) {
      console.error('Failed to fetch profile stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const MEDICAL_TABS = ['History', 'Medications', 'Reports']

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.25)',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'linear-gradient(-45deg, #0a192f, #004d40, #0074d9, #10b981, #7fdbff)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>

      {/* Floating Blobs for extra depth */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(0, 116, 217, 0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Minimal Header (Site Name Navigation) */}
      <header style={{
        width: '100%',
        padding: '2rem 4rem',
        display: 'flex',
        justifyContent: 'flex-start',
        zIndex: 10
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'transform 0.3s' }} 
          onClick={() => navigate('/home')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src={logo} alt="Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #7fdbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Swasthya Setu
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '1100px',
        padding: '1rem 2rem 4rem',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        
        {/* Header Profile Card */}
        <div style={{
          ...glassStyle,
          padding: '3rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '3.5rem',
          position: 'relative'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: 160, height: 160, borderRadius: '50%', 
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              padding: 5, boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a192f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', overflow: 'hidden' }}>
                {user?.avatar_b64 ? <img src={user.avatar_b64} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : (user?.full_name || 'A')[0]}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: '#10b981', border: '4px solid #0a192f' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '2.75rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{user?.full_name || 'ASHA Worker'}</h1>
                <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Registered ASHA • {user?.location || 'Pune District'}</p>
                <div style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, display: 'inline-block', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Employee ID: <span style={{ fontWeight: 700, color: '#7fdbff' }}>{user?.employee_id}</span>
                </div>
              </div>
              <button 
                style={{ 
                  padding: '1rem 2rem', borderRadius: 16, 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                  fontSize: '1rem', transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Edit Profile
              </button>
            </div>
            <p style={{ marginTop: '2rem', maxWidth: 700, color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.125rem', lineHeight: 1.7 }}>
              Dedicated community health worker helping bridge the gap in rural healthcare since 2021. Specializing in maternal care and digital health record management.
            </p>
          </div>
        </div>

        {/* Health Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {/* Card 1: Patients Visited */}
          <div style={{
            ...glassStyle,
            padding: '2rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'default'
          }} 
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'; e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '2rem' }}><ActivityIcon size={32} /></span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.2)', padding: '4px 12px', borderRadius: 8 }}>Total Reach</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem', letterSpacing: '-0.01em' }}>{loading ? '...' : stats.patientCount}</div>
            <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>number of patients visited</div>
          </div>

          {/* Card 2: Last Patient */}
          <div style={{
            ...glassStyle,
            padding: '2rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'default'
          }} 
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'; e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '2rem' }}><CalendarIcon size={32} /></span>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: 8 }}>Active</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.5rem', letterSpacing: '-0.01em' }}>{loading ? '...' : stats.lastPatientTime}</div>
            <div style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>last patient entered</div>
          </div>
        </div>

        {/* Tabbed Info Section */}
        <div style={{ ...glassStyle, padding: '3rem' }}>
          <div style={{ display: 'flex', gap: '3.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '2.5rem' }}>
            {MEDICAL_TABS.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1rem 0',
                  background: 'none', border: 'none',
                  color: activeTab === tab ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 800, fontSize: '1.125rem',
                  position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                {tab}
                {activeTab === tab && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#10b981', boxShadow: '0 0 15px #10b981' }} />}
              </button>
            ))}
          </div>

          <div style={{ minHeight: 250 }}>
            {activeTab === 'History' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {stats.rawRecords.length === 0 && !loading && (
                    <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>No recent patient activity recorded.</div>
                )}
                {stats.rawRecords.slice(0, 5).map(record => (
                  <div key={record.id} style={{ 
                    padding: '1.75rem', 
                    background: 'rgba(255, 255, 255, 0.04)', 
                    borderRadius: 20, 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{record.patient_name || 'Patient Triage'}</div>
                      <div style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 6 }}>{record.district} • {record.brief?.substring(0, 40)}...</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                          fontWeight: 800, 
                          color: record.severity === 'red' ? '#ef4444' : record.severity === 'yellow' ? '#f59e0b' : '#10b981',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '4px 8px',
                          borderRadius: 6
                      }}>
                        {record.severity || 'STABLE'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: 8 }}>
                        {new Date(record.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab !== 'History' && (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', fontSize: '1.125rem' }}>
                No {activeTab.toLowerCase()} found in this category.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
