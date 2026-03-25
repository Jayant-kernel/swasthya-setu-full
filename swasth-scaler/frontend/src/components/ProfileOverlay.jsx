import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProfileOverlay({ onClose }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        navigate('/login/asha')
        return
      }
      setUser(user)

      const savedAvatar = localStorage.getItem(`avatar_${user.id}`)
      if (savedAvatar) setAvatar(savedAvatar)

      const { data: records } = await supabase
        .from('triage_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (records) setHistory(records)
      setLoading(false)
    }
    loadProfile()
  }, [navigate])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 250
        const MAX_HEIGHT = 250
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        setAvatar(dataUrl)
        if (user) {
          localStorage.setItem(`avatar_${user.id}`, dataUrl)
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? All related patient history records will be permanently eradicated. This action cannot be undone."
    )
    if (!confirmDelete) return

    try {
      if (user) {
        await supabase.from('triage_records').delete().eq('user_id', user.id)
        localStorage.removeItem(`avatar_${user.id}`)
        await supabase.auth.updateUser({ data: { deleted: true } })
        await supabase.auth.signOut()
        navigate('/')
      }
    } catch (err) {
      alert("Failed to delete account: " + err.message)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>Profile</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>प्रोफाईल</div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', width: 36, height: 36, borderRadius: '50%' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}><span className="spinner spinner-dark" /></div>
      ) : (
        <main style={{ flex: 1, padding: '2rem 1.25rem', maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'var(--surface)', padding: '2rem 1.5rem', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#F3F4F6', overflow: 'hidden', border: '3px solid #0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatar ? (
                  <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, background: '#0F6E56', color: 'var(--surface)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                title="Upload Picture"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{user?.email}</h2>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>Healthcare Provider</div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem 1.5rem', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>Patient History</h3>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>रुग्ण इतिहास</div>
              </div>
              <div style={{ background: 'var(--success-bg)', color: '#0F6E56', padding: '0.35rem 0.85rem', borderRadius: 99, fontSize: '0.875rem', fontWeight: 700 }}>
                {history.length} Visits
              </div>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9CA3AF', fontSize: '0.9375rem' }}>
                No patients triaged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 400, overflowY: 'auto' }}>
                {history.map(record => {
                  const date = new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  let sevColor = '#1A6E5C'
                  let sevBg = 'var(--success-bg)'
                  if (record.severity === 'red') { sevColor = '#C0392B'; sevBg = 'var(--error-bg)'; }
                  if (record.severity === 'yellow') { sevColor = '#B7791F'; sevBg = '#FFFBEB'; }

                  return (
                    <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9375rem' }}>{record.patient_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: 4 }}>{record.age}y · {record.gender} · {record.district}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>Date: {date}</div>
                      </div>
                      <div style={{ background: sevBg, color: sevColor, padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {record.severity}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem 1.5rem', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Danger Zone</h3>
            
            <button
              onClick={handleLogout}
              style={{ padding: '1rem 1.25rem', background: 'var(--surface)', border: '1.5px solid #e5e7eb', borderRadius: 12, color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9375rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout Securely
            </button>

            <button
              onClick={handleDeleteAccount}
              style={{ padding: '1rem 1.25rem', background: 'var(--error-bg)', border: '1.5px solid #FCA5A5', borderRadius: 12, color: 'var(--error-text)', fontWeight: 700, fontSize: '0.9375rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete Account Permanently
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
