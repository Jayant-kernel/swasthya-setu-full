import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import AdminSidebar from '../../components/AdminSidebar'
import { SunIcon, MoonIcon, ActivityIcon, GlobeIcon } from './AdminIcons'
import { API } from './constants'

const StatCard = ({ label, value, subtext, icon: Icon, color = '#3b82f6', g }) => (
  <div style={{ background: g.cardBg, borderRadius: 16, padding: '1.5rem', boxShadow: g.cardShd, border: `1px solid ${g.cardBdr}`, flex: 1, backdropFilter: g.blur }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon />
      </div>
      <div style={{ color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>
        NATIONAL
      </div>
    </div>
    <div style={{ fontSize: '0.8125rem', color: g.muted, fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: g.text }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: g.label, marginTop: 4 }}>{subtext}</div>
  </div>
)

const DistrictDetailModal = ({ isOpen, onClose, stats, mode, g, triageRecords, outbreaks }) => {
  if (!isOpen || !stats) return null

  const trendData = useMemo(() => {
    if (mode === 'cases') {
      const daily = {}
      triageRecords.filter(r => (r.district || 'General') === stats.name).forEach(r => {
        const d = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        daily[d] = (daily[d] || 0) + 1
      })
      return Object.entries(daily).map(([label, value]) => ({ label, value })).slice(-7)
    } else {
      const weekly = {}
      outbreaks.filter(o => o.district === stats.name).forEach(o => {
        const l = `W${o.week}`
        weekly[l] = (weekly[l] || 0) + (o.cases || 0)
      })
      return Object.entries(weekly).map(([label, value]) => ({ label, value })).slice(-7)
    }
  }, [stats, mode, triageRecords, outbreaks])

  const maxVal = Math.max(...trendData.map(d => d.value), 1)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 700, background: g.cardBg, borderRadius: 24, border: `1px solid ${g.cardBdr}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '2rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: g.text }}>{stats.name}</h2>
            <div style={{ fontSize: '0.875rem', color: g.muted, marginTop: 4 }}>{mode === 'cases' ? 'Triage Analytics Record' : 'Disease Outbreak History'}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: g.insetBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>×</button>
        </div>
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend Over Performance</h4>
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '0 10px' }}>
              {trendData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', width: '100%', height: `${(d.value / maxVal) * 160}px`, background: 'linear-gradient(to top, #4f46e5, #818cf8)', borderRadius: '6px 6px 4px 4px', transition: 'height 0.3s ease', boxShadow: '0 4px 12px rgba(79,70,229,0.2)' }}>
                    <div style={{ position: 'absolute', top: -20, left: 0, right: 0, textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: g.text }}>{d.value}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: g.muted }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {mode === 'cases' ? (
              <>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, marginBottom: 4 }}>CRITICAL</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{stats.critical}</div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800, marginBottom: 4 }}>MODERATE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{stats.moderate}</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 800, marginBottom: 4 }}>TOTAL LOAD</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{stats.total}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, marginBottom: 4 }}>DEATHS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{stats.totalDeaths}</div>
                </div>
                <div style={{ background: 'rgba(124,58,237,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 800, marginBottom: 4 }}>FATALITY %</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{((stats.totalDeaths / (stats.totalCases || 1)) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 800, marginBottom: 4 }}>TOTAL CASES</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: g.text }}>{stats.totalCases}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const location = useLocation()
  const activeTab = location.pathname.includes('analytics') ? 'analytics' : 'overview'
  const [triageRecords, setTriageRecords] = useState([])
  const [outbreaks, setOutbreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [analyticsMode, setAnalyticsMode] = useState('cases') // 'cases' | 'outbreaks'
  const [selectedDistrictStats, setSelectedDistrictStats] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, outRes] = await Promise.allSettled([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/outbreaks/`, { headers }),
      ])
      if (triRes.status === 'fulfilled' && triRes.value.ok) {
        setTriageRecords(await triRes.value.json())
      }
      if (outRes.status === 'fulfilled' && outRes.value.ok) {
        const data = await outRes.value.json()
        setOutbreaks(Array.isArray(data) ? data : [])
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [fetchData])

  const stats = useMemo(() => {
    const total = triageRecords.length
    const critical = triageRecords.filter(r => r.severity === 'red').length
    const districts = new Set(triageRecords.map(r => r.district).filter(Boolean)).size
    return { total, critical, districts }
  }, [triageRecords])

  const regionStats = useMemo(() => {
    const groups = {}
    triageRecords.forEach(r => {
      const d = r.district || 'General'
      if (!groups[d]) {
        groups[d] = {
          name: d, total: 0, critical: 0, moderate: 0, stable: 0,
          sickle: 0, app: 0, ivr: 0, lastUpdate: r.created_at
        }
      }
      groups[d].total++
      if (r.severity === 'red' || Number(r.severity) >= 7) groups[d].critical++
      else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) groups[d].moderate++
      else groups[d].stable++
      if (r.sickle_cell_risk) groups[d].sickle++
      if (r.source === 'helpline_call') groups[d].ivr++
      else groups[d].app++
      if (r.created_at > groups[d].lastUpdate) groups[d].lastUpdate = r.created_at
    })
    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [triageRecords])

  const outbreakRegionStats = useMemo(() => {
    const groups = {}
    outbreaks.forEach(o => {
      const d = o.district || 'General'
      if (!groups[d]) {
        groups[d] = {
          name: d, totalCases: 0, totalDeaths: 0,
          diseases: new Set(), lastUpdate: o.year ? `${o.year} W${o.week}` : 'N/A'
        }
      }
      groups[d].totalCases += (o.cases || 0)
      groups[d].totalDeaths += (o.deaths || 0)
      if (o.disease) groups[d].diseases.add(o.disease)
      if (o.year && o.week) {
        const key = `${o.year}-${String(o.week).padStart(2, '0')}`
        if (!groups[d]._sortKey || key > groups[d]._sortKey) {
          groups[d]._sortKey = key
          groups[d].lastUpdate = `${o.year} Week ${o.week}`
        }
      }
    })
    return Object.values(groups).map(g => ({
      ...g,
      diseaseCount: g.diseases.size,
      topDiseases: Array.from(g.diseases).slice(0, 3).join(', ') + (g.diseases.size > 3 ? '...' : '')
    })).sort((a, b) => b.totalCases - a.totalCases)
  }, [outbreaks])

  const g = useMemo(() => ({
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)',
    insetBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
  }), [isDark])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${g.divider}; border-radius: 10px; }
        .nav-link:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; color: ${g.accent}; }
        .nav-link.active { background: ${isDark ? 'rgba(79,70,229,0.15)' : '#eef2ff'}; color: #4f46e5; font-weight: 700; border-left: 3px solid #4f46e5; }
        .table-row:hover { background: ${g.insetBg}; cursor: pointer; }
      `}</style>

      <AdminSidebar isHovered={isHovered} setIsHovered={setIsHovered} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: g.text, letterSpacing: '0.02em' }}>Live System Status</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: g.text }}>Administrator</div>
              <div style={{ fontSize: '0.65rem', color: g.label, fontWeight: 600 }}>Command Center</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>A</div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          {activeTab === 'overview' ? (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: '0 0 0.25rem' }}>National Health Command</h1>
                  <p style={{ margin: 0, color: g.muted, fontSize: '0.9375rem' }}>Aggregated data from all active districts.</p>
                </div>
                <div style={{ color: g.label, fontSize: '0.8125rem', fontWeight: 600 }}>Last Sync: {lastRefresh.toLocaleTimeString()}</div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <StatCard label="Total Triage Instances" value={stats.total} subtext="Global record count" icon={ActivityIcon} color="#4f46e5" g={g} />
                <StatCard label="Active Districts" value={stats.districts} subtext="Reporting PHC regions" icon={GlobeIcon} color="#34d399" g={g} />
                <StatCard label="National Alerts (RED)" value={stats.critical} subtext="High-severity cases" icon={ActivityIcon} color="#ef4444" g={g} />
              </div>

              <div style={{ background: g.cardBg, borderRadius: 16, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}` }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>Recent Global Triage Events</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: g.insetBg }}>
                      <tr>
                        {['Patient', 'District', 'Severity', 'Date'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {triageRecords.slice(0, 15).map((record) => (
                        <tr key={record.id} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ fontWeight: 700, color: g.text }}>{record.patient_name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.75rem', color: g.muted }}>ID: {record.id?.substring(0, 8)}</div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{record.district || 'General'}</td>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: (record.severity === 'red' || Number(record.severity) >= 7) ? '#ef4444' : (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? '#f59e0b' : '#10b981' }}>
                              {(record.severity === 'red' || Number(record.severity) >= 7) ? 'CRITICAL' : (record.severity === 'yellow' || (Number(record.severity) >= 4 && Number(record.severity) <= 6)) ? 'MODERATE' : 'STABLE'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.muted, fontSize: '0.8125rem' }}>{new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: '0 0 0.25rem' }}>Regional Data Insights</h1>
                  <p style={{ margin: 0, color: g.muted, fontSize: '0.9375rem' }}>Performance and severity breakdown aggregated by active districts.</p>
                </div>
                <div style={{ display: 'flex', background: g.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${g.cardBdr}`, gap: 4 }}>
                  <button onClick={() => setAnalyticsMode('cases')} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700, background: analyticsMode === 'cases' ? '#4f46e5' : 'transparent', color: analyticsMode === 'cases' ? '#fff' : g.muted }}>Triage Cases</button>
                  <button onClick={() => setAnalyticsMode('outbreaks')} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700, background: analyticsMode === 'outbreaks' ? '#4f46e5' : 'transparent', color: analyticsMode === 'outbreaks' ? '#fff' : g.muted }}>Disease Outbreaks</button>
                </div>
              </div>

              <div style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, overflow: 'hidden', boxShadow: g.cardShd }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}` }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: g.text }}>{analyticsMode === 'cases' ? 'Comparative Region Performance' : 'District Outbreak Comparison'}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {analyticsMode === 'cases' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: g.insetBg }}>
                        <tr>
                          {['District', 'Total Traffic', 'Alert Rate', 'Sickle indexed', 'Primary Source'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {regionStats.map(region => (
                          <tr key={region.name} onClick={() => { setSelectedDistrictStats(region); setIsDetailModalOpen(true) }} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: g.text }}>{region.name}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.total}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ color: region.critical > 0 ? '#ef4444' : g.muted, fontWeight: 700 }}>{Math.round((region.critical / (region.total || 1)) * 100)}%</span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.sickle} cases</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ fontSize: '0.8125rem', padding: '4px 10px', borderRadius: 20, background: region.app >= region.ivr ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.12)', color: region.app >= region.ivr ? '#10b981' : '#7c3aed', fontWeight: 700 }}>{region.app >= region.ivr ? 'MOBILE APP' : 'IVR HELPLINE'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: g.insetBg }}>
                        <tr>
                          {['District', 'Total Cases', 'Reported Deaths', 'Fatality Rate', 'Diseases Count'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outbreakRegionStats.map(region => (
                          <tr key={region.name} onClick={() => { setSelectedDistrictStats(region); setIsDetailModalOpen(true) }} className="table-row" style={{ borderBottom: `1px solid ${g.divider}` }}>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: g.text }}>{region.name}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.totalCases.toLocaleString()}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#ef4444', fontWeight: 700 }}>{region.totalDeaths.toLocaleString()}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ color: g.text, fontWeight: 700 }}>{((region.totalDeaths / (region.totalCases || 1)) * 100).toFixed(2)}%</span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: g.text }}>{region.diseaseCount} types</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <DistrictDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        stats={selectedDistrictStats}
        mode={analyticsMode}
        g={g}
        triageRecords={triageRecords}
        outbreaks={outbreaks}
      />
    </div>
  )
}
