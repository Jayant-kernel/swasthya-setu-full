import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext.jsx'
// logo import removed
import DashboardLayout from '../components/DashboardLayout.jsx'

/* ─── Icons (same as HomePage) ─────────────────────────────── */
const GridIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const PatientIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
  </svg>
)
const ChatIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const SearchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ChevRight = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevDown = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const MenuBars = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const EditIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const LogoutIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const TrashIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const CameraIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]



/* ═══════════════════════════════════════════════════════════
   ProfilePage
   ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser, logout } = useAuth()
  const { isDark } = useTheme()

  // Profile state
  const [user, setUser] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [forceOnboard, setForceOnboard] = useState(false)
  const [fullName, setFullName] = useState('')
  const [location2, setLocation2] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  const fileInputRef = useRef(null)


  useEffect(() => {
    async function loadProfile() {
      if (!authUser) { navigate('/login/asha'); return }
      setUser(authUser)
      const savedName = authUser.full_name || ''
      const savedLoc = authUser.location || ''
      setFullName(savedName)
      setLocation2(savedLoc)
      if (!savedName || !savedLoc) { setForceOnboard(true); setIsEditing(true) }
      if (authUser.avatar_b64) setAvatar(authUser.avatar_b64)
      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setHistory(await res.json())
      } catch (err) { console.error('Failed to load history', err) }
      setLoading(false)
    }
    loadProfile()
  }, [authUser, navigate])

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 250, canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
        else { if (h > MAX) { w *= MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setAvatar(dataUrl)
        const token = localStorage.getItem('access_token')
        fetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar_b64: dataUrl })
        })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile() {
    if (!fullName.trim() || !location2.trim()) { alert('Name and Location are required.'); return }
    setSaveLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      await fetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), location: location2.trim() })
      })
      const updated = { ...user, full_name: fullName.trim(), location: location2.trim() }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setIsEditing(false); setForceOnboard(false)
    } catch (err) { alert('Failed to save: ' + err.message) }
    finally { setSaveLoading(false) }
  }

  async function handleLogout() { await logout(); navigate('/') }

  async function handleDeleteAccount() {
    if (!window.confirm('Delete your account? All patient history will be permanently erased. This cannot be undone.')) return
    try {
      if (user?.id) { localStorage.removeItem(`avatar_${user.id}`); await logout(); navigate('/') }
    } catch (err) { alert('Failed to delete account: ' + err.message) }
  }

  const g = {
    panelBg: 'var(--g-panel-bg)',
    panelBdr: 'var(--g-panel-bdr)',
    blur: 'var(--g-blur)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    cardShd: 'var(--g-card-shd)',
    insetBg: 'rgba(0,0,0,0.18)',
    rowHover: 'var(--g-row-hover)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    hover: 'var(--g-hover)',
    divider: 'var(--g-divider)',
    btn: 'var(--g-btn)',
    btnBdr: 'var(--g-btn-bdr)',
  }

  const panel = { background: g.panelBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur }
  const card = { background: g.cardBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur, border: `1px solid ${g.cardBdr}`, borderRadius: 16, boxShadow: g.cardShd }
  const glassInput = {
    background: 'var(--g-btn)',
    border: `1.5px solid ${g.btnBdr}`, backdropFilter: 'blur(16px)',
    color: g.text, outline: 'none', transition: 'all .2s',
    fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
  }

  const sevConfig = {
    red: { label: 'Emergency', color: '#f87171', bg: 'rgba(239,68,68,0.14)', bdr: 'rgba(239,68,68,0.30)' },
    yellow: { label: 'Moderate', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', bdr: 'rgba(245,158,11,0.30)' },
    green: { label: 'Stable', color: '#34d399', bg: 'rgba(52,211,153,0.14)', bdr: 'rgba(52,211,153,0.30)' },
  }

  const breadcrumbs = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: g.muted }}>
      <span style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>Dashboard</span>
      <span style={{ opacity: 0.5 }}>›</span>
      <span style={{ color: g.text, fontWeight: 600 }}>Profile</span>
    </div>
  )

  return (
    <DashboardLayout topbarContent={breadcrumbs}>
      <style>{`
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--g-divider);border-radius:99px;}
        .pp-row:hover{background:var(--g-row-hover)!important;}
        .pp-input:focus{border-color:var(--g-accent)!important;box-shadow:0 0 0 3px rgba(16,185,129,0.15)!important;}
      `}</style>



        {/* ── Page Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.875rem', color: g.muted }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${g.cardBdr}`, borderTopColor: g.accent, borderRadius: '50%', animation: 'pp-spin 0.8s linear infinite' }} />
              <style>{`@keyframes pp-spin{to{transform:rotate(360deg)}}`}</style>
              Loading profile…
            </div>
          ) : (
            <>
              {/* ── Profile Header Card ── */}
              <div style={{ ...card, padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{ width: 88, height: 88, borderRadius: '50%', background: g.insetBg, border: `3px solid ${g.cardBdr}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 4px ${g.accentL}` }}
                    >
                      {avatar
                        ? <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '2.25rem' }}>👩‍⚕️</span>
                      }
                    </div>
                  </div>

                  {/* Name / edit form */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {!isEditing ? (
                      <>
                        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, color: g.text, letterSpacing: '-0.025em' }}>
                          {user?.full_name || 'Set your name'}
                        </h1>
                        <div style={{ fontSize: '0.875rem', color: g.accent, fontWeight: 600, marginBottom: '0.25rem' }}>Healthcare Provider</div>
                        {user?.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: g.muted, marginBottom: '0.25rem' }}>
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {user.location}
                          </div>
                        )}
                        {user?.employee_id && <div style={{ fontSize: '0.75rem', color: g.label, marginBottom: '1rem' }}>ID: {user.employee_id}</div>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: g.text, marginBottom: 3 }}>
                          {forceOnboard ? 'Complete your profile' : 'Edit Profile'}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: g.muted, marginBottom: '1.25rem' }}>
                          {forceOnboard ? 'Required to serve patients' : 'Update your details below'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Full Name</label>
                            <input
                              className="pp-input"
                              value={fullName} onChange={e => setFullName(e.target.value)}
                              placeholder="E.g., Anjali Sharma"
                              style={{ ...glassInput, width: '100%', padding: '0.625rem 0.875rem', borderRadius: 10, fontSize: '0.9rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Location / Village</label>
                            <input
                              className="pp-input"
                              value={location2} onChange={e => setLocation2(e.target.value)}
                              placeholder="E.g., Pune District"
                              style={{ ...glassInput, width: '100%', padding: '0.625rem 0.875rem', borderRadius: 10, fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          {!forceOnboard && (
                            <button
                              onClick={() => { setIsEditing(false); setFullName(user?.full_name || ''); setLocation2(user?.location || '') }}
                              style={{ padding: '0.5rem 1.125rem', borderRadius: 99, background: 'transparent', border: `1px solid ${g.cardBdr}`, color: g.muted, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                            >Cancel</button>
                          )}
                          <button
                            onClick={handleSaveProfile} disabled={saveLoading}
                            style={{ padding: '0.5rem 1.375rem', borderRadius: 99, background: 'linear-gradient(135deg,#0d9488,#10b981)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(16,185,129,0.38)', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                          >
                            {saveLoading ? 'Saving…' : 'Save Details'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Meta grid (right side) */}
                  {!isEditing && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem 2rem', alignSelf: 'center' }}>
                      {[
                        { label: 'Status', value: 'Active', accent: true },
                        { label: 'Department', value: 'Primary Care' },
                        { label: 'Employee ID', value: user?.employee_id || '—' },
                        { label: 'Total Records', value: `${history.length} Visits` },
                      ].map(m => (
                        <div key={m.label}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: m.accent ? g.accent : g.text }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Patient History Table ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text, letterSpacing: '-0.02em' }}>
                    Patient History
                    <span style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 500, marginLeft: 8 }}>रुग्ण इतिहास</span>
                  </h2>
                  <span style={{ background: g.accentL, color: g.accentT, padding: '0.25rem 0.875rem', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, border: `1px solid ${g.accentB}` }}>
                    {history.length} Visits
                  </span>
                </div>

                <div style={{ ...card, overflow: 'hidden' }}>
                  {history.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.5 }}>📂</div>
                      <div style={{ fontWeight: 700, color: g.text, marginBottom: 4 }}>No patients triaged yet.</div>
                      <div style={{ fontSize: '0.875rem' }}>Your submitted records will appear here.</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${g.divider}`, background: g.insetBg, backdropFilter: 'blur(8px)' }}>
                          {['Patient', 'Age / Gender', 'District', 'Severity', 'Date'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1.375rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: g.label, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((record, i) => {
                          const cfg = sevConfig[record.severity] || sevConfig.green
                          const date = new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          return (
                            <tr
                              key={record.id}
                              className="pp-row"
                              style={{ borderBottom: i < history.length - 1 ? `1px solid ${g.divider}` : 'none', transition: 'background .12s', cursor: 'default' }}
                            >
                              <td style={{ padding: '0.875rem 1.375rem', fontWeight: 700, fontSize: '0.875rem', color: g.text }}>{record.patient_name}</td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.muted }}>{record.age}y · {record.gender}</td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.text }}>{record.district}</td>
                              <td style={{ padding: '0.875rem 1.375rem' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: cfg.bg, border: `1px solid ${cfg.bdr}`, fontSize: '0.71rem', fontWeight: 700, color: cfg.color, backdropFilter: 'blur(8px)' }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
                                  {cfg.label}
                                </span>
                              </td>
                              <td style={{ padding: '0.875rem 1.375rem', fontSize: '0.8rem', color: g.muted, whiteSpace: 'nowrap' }}>{date}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Account Actions ── */}
              {!forceOnboard && (
                <div style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: g.text, marginBottom: 2 }}>Account Actions</div>
                    <div style={{ fontSize: '0.8125rem', color: g.muted }}>Manage your session and account data</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.875rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.25rem', borderRadius: 10, background: g.btn, border: `1px solid ${g.btnBdr}`, color: g.btnT, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all .18s', backdropFilter: 'blur(12px)', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = isDark ? '#fff' : '#0c2a1d' }}
                      onMouseLeave={e => { e.currentTarget.style.background = g.btn; e.currentTarget.style.color = g.btnT }}
                    >
                      <LogoutIcon /> Sign Out
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.25rem', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all .18s', fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; e.currentTarget.style.color = '#f87171' }}
                    >
                      <TrashIcon /> Delete Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </DashboardLayout>
  )
}