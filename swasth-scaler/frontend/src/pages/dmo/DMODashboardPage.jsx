import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import DMOSidebar from '../../components/dmo/DMOSidebar'
import { SunIcon, MoonIcon, SearchIcon, ActivityIcon } from '../admin/AdminIcons'
import { API, DISTRICT_CENTERS, buildMapPoints } from './DMOShared'

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6', g }) => (
  <div className="stat-card" style={{ background: g.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: g.cardShd, border: `1px solid ${g.cardBdr}`, flex: 1, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>DISTRICT</div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: g.text }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>{subtext}</div>
  </div>
)

const Calendar = ({ triageRecords, selectedDate, setSelectedDate, g, isDark }) => {
  const daysInApril = 30
  const days = Array.from({ length: daysInApril }, (_, i) => i + 1)
  const counts = useMemo(() => {
    const c = {}
    triageRecords.forEach(r => {
      const d = new Date(r.created_at)
      if (d.getMonth() === 3 && d.getFullYear() === 2026) {
        const day = d.getDate()
        c[day] = (c[day] || 0) + 1
      }
    })
    return c
  }, [triageRecords])

  return (
    <div style={{ background: g.cardBg, borderRadius: 20, padding: '1.5rem', border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, backdropFilter: g.blur }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: g.text }}>Activity Calendar</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: 6 }}>APRIL 2026</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: g.label, marginBottom: 4 }}>{d}</div>)}
        {days.map(d => {
          const hasData = counts[d] > 0
          const active = selectedDate === d
          return (
            <div key={d} onClick={() => setSelectedDate(active ? null : d)} style={{
              height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8125rem', fontWeight: 700,
              background: active ? '#3b82f6' : (hasData ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff') : 'transparent'),
              color: active ? '#fff' : (hasData ? '#3b82f6' : g.muted),
              border: active ? 'none' : `1px solid ${hasData ? (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe') : 'transparent'}`
            }}>{d}</div>
          )
        })}
      </div>
      <button onClick={() => setSelectedDate(null)} style={{ marginTop: '1.25rem', width: '100%', padding: '0.625rem', borderRadius: 10, border: `1px solid ${g.divider}`, background: g.insetBg, color: g.muted, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg> Reset
      </button>
    </div>
  )
}

export default function DMODashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [triageRecords, setTriageRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' }
      }

      if (prev.direction === 'asc') {
        return { key, direction: 'desc' }
      }

      return { key: null, direction: null }
    })
  }, [])

  const g = useMemo(() => ({
    text: 'var(--g-text)', muted: 'var(--g-muted)', label: 'var(--g-label)', accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)', cardBdr: 'var(--g-card-bdr)', cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)', insetBg: 'var(--g-inset-bg)', blur: 'var(--g-blur)',
  }), [isDark])

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await fetch(`${API}/triage_records/`, { headers })
      if (res.ok) setTriageRecords(await res.json())
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = useMemo(() => ({
    unreviewed: triageRecords.filter(r => !r.reviewed).length,
    critical: triageRecords.filter(r => r.severity === 'red' || Number(r.severity) >= 7).length,
    sickle: triageRecords.filter(r => r.sickle_cell_risk).length,
  }), [triageRecords])

  const sortedRecords = useMemo(() => {
    const getSeverityRank = (record) => {
      if (record.severity === 'red' || Number(record.severity) >= 7) return 3
      if (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) return 2
      return 1
    }

    const getSortValue = (record, key) => {
      if (key === 'severity') return getSeverityRank(record)
      if (key === 'status') return record.reviewed ? 1 : 0
      if (key === 'patient_name') return (record.patient_name || '').toLowerCase()
      if (key === 'health_condition') return (record.health_condition || '').toLowerCase()
      return ''
    }

    let items = [...triageRecords]
    if (selectedDate) {
      items = items.filter(r => {
        const d = new Date(r.created_at)
        return d.getDate() === selectedDate && d.getMonth() === 3 && d.getFullYear() === 2026
      })
    }
    if (sortConfig.key && sortConfig.direction) {
      items.sort((a,b) => {
        const av = getSortValue(a, sortConfig.key)
        const bv = getSortValue(b, sortConfig.key)
        if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1
        if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return items
  }, [triageRecords, sortConfig, selectedDate])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .nav-link:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; color: ${g.accent}; }
        .nav-link.active { background: ${isDark ? 'rgba(59,130,246,0.15)' : '#ebf5ff'}; color: #3b82f6; font-weight: 700; border-left: 3px solid #3b82f6; }
        .table-row:hover { background: ${g.insetBg}; cursor: pointer; }
        .stat-card { position: relative; top: 0; transition: top 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { top: -4px; box-shadow: 0 12px 28px rgba(59,130,246,0.14); }
      `}</style>

      <DMOSidebar isHovered={isHovered} setIsHovered={setIsHovered} onLogout={() => {logout(); navigate('/')}} onAdminNav={() => navigate('/dashboard/admin')} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: g.text }}>DMO Command Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>D</div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', maxWidth: 1600, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <StatCard label="Pending Review" value={stats.unreviewed} subtext="Action required" icon={ActivityIcon} color="#f59e0b" g={g} />
                <StatCard label="Critical Cases" value={stats.critical} subtext="Severe escalations" icon={ActivityIcon} color="#ef4444" g={g} />
                <StatCard label="Sickle Cell Risk" value={stats.sickle} subtext="Screening results" icon={ActivityIcon} color="#8b5cf6" g={g} />
              </div>

              <div style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}` }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>Patient Triage Feed</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: g.insetBg }}>
                      <tr>
                        {[
                          { label: 'Patient', key: 'patient_name' },
                          { label: 'Health Condition', key: 'health_condition' },
                          { label: 'Severity', key: 'severity' },
                          { label: 'Status', key: 'status' },
                        ].map((h) => (
                          <th key={h.key} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>
                            <button
                              type="button"
                              onClick={() => handleSort(h.key)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                textTransform: 'inherit',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: 0,
                              }}
                            >
                              {h.label}
                              <span style={{ fontSize: '0.65rem', color: sortConfig.key === h.key ? '#3b82f6' : g.muted }}>
                                {sortConfig.key === h.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                              </span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map((r) => (
                        <tr key={r.id} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: 700, color: g.text }}>{r.patient_name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.7rem', color: g.muted }}>{r.district}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.text, fontSize: '0.85rem' }}>{r.health_condition || 'N/A'}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ fontWeight: 800, color: (r.severity === 'red' || Number(r.severity) >= 7) ? '#ef4444' : (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) ? '#f59e0b' : '#10b981' }}>
                              {(r.severity === 'red' || Number(r.severity) >= 7) ? 'CRITICAL' : (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) ? 'MODERATE' : 'STABLE'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, background: r.reviewed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.reviewed ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                              {r.reviewed ? 'REVIEWED' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <Calendar triageRecords={triageRecords} selectedDate={selectedDate} setSelectedDate={setSelectedDate} g={g} isDark={isDark} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
