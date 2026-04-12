import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { SunIcon, MoonIcon } from './AdminIcons'
import { API, DISTRICT_CENTERS, INDIA_CENTER, INDIA_BOUNDS } from './constants'

const DistrictHeatmap = lazy(() => import('../../components/common/DistrictHeatmap'))

export default function AdminMapPage() {
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [triageRecords, setTriageRecords] = useState([])
  const [outbreaks, setOutbreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d') // '24h' | '3d' | '7d' | '30d' | 'all' | 'custom'
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, outRes] = await Promise.allSettled([
        fetch(`${API}/triage_records/`, { headers }),
        fetch(`${API}/outbreaks/`, { headers }),
      ])
      if (triRes.status === 'fulfilled' && triRes.value.ok) setTriageRecords(await triRes.value.json())
      if (outRes.status === 'fulfilled' && outRes.value.ok) setOutbreaks(await outRes.value.json())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getOutbreakDate = (o) => {
    if (o.created_at) return new Date(o.created_at)
    if (o.year && o.week) {
      const d = new Date(o.year, 0, 1 + (o.week - 1) * 7)
      return d
    }
    return new Date(0) // Default to beginning of time if no data
  }

  const filteredRecords = useMemo(() => {
    const now = new Date()
    let start, end = new Date()
    
    if (timeRange === 'all') return triageRecords
    if (timeRange === 'custom') {
      if (!customStart) return triageRecords
      start = new Date(customStart)
      if (customEnd) end = new Date(customEnd)
    } else {
      const diffs = { '24h': 1, '3d': 3, '7d': 7, '30d': 30 }
      start = new Date(now.setDate(now.getDate() - diffs[timeRange]))
    }

    return triageRecords.filter(r => {
      const d = new Date(r.created_at)
      return d >= start && d <= end
    })
  }, [triageRecords, timeRange, customStart, customEnd])

  const filteredOutbreaks = useMemo(() => {
    const now = new Date()
    let start, end = new Date()

    if (timeRange === 'all') return outbreaks
    if (timeRange === 'custom') {
      if (!customStart) return outbreaks
      start = new Date(customStart)
      if (customEnd) end = new Date(customEnd)
    } else {
      const diffs = { '24h': 1, '3d': 3, '7d': 7, '30d': 30 }
      start = new Date(now.setDate(now.getDate() - diffs[timeRange]))
    }

    return outbreaks.filter(o => {
      const d = getOutbreakDate(o)
      return d >= start && d <= end
    })
  }, [outbreaks, timeRange, customStart, customEnd])

  const mapPoints = useMemo(() => {
    const withGps = filteredRecords.filter(r => r.latitude && r.longitude)
    const withoutGps = filteredRecords.filter(r => !r.latitude || !r.longitude)

    const gpsPoints = withGps.map(r => ({
      village: r.patient_name || 'Patient',
      total: 1, critical: r.severity === 'red' ? 1 : 0, moderate: r.severity === 'yellow' ? 1 : 0, mild: r.severity === 'green' ? 1 : 0,
      lastReported: new Date(r.created_at).toLocaleString('en-IN'),
      lat: r.latitude, lng: r.longitude,
      ashaWorker: r.user_name
    }))

    const groups = {}
    withoutGps.forEach(r => {
      const d = r.district || 'Unknown'
      if (!groups[d]) groups[d] = { village: d, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
      groups[d].total++
      if (r.severity === 'red' || Number(r.severity) >= 7) groups[d].critical++
      else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) groups[d].moderate++
      else groups[d].mild++
      if (r.created_at > groups[d].lastReported) groups[d].lastReported = r.created_at
    })

    const legacyPoints = Object.entries(groups).map(([district, g]) => {
      const coords = DISTRICT_CENTERS[district]
      if (!coords) return null
      return { ...g, lat: coords[0], lng: coords[1], lastReported: new Date(g.lastReported).toLocaleString('en-IN') }
    }).filter(Boolean)

    return [...gpsPoints, ...legacyPoints]
  }, [filteredRecords])

  const g = useMemo(() => ({
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    label: 'var(--g-label)',
    divider: 'var(--g-divider)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    muted: 'var(--g-muted)'
  }), [])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <AdminSidebar isHovered={isHovered} setIsHovered={setIsHovered} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: g.text }}>Geospatial Command</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>M</div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: g.text, margin: 0 }}>National Health Heatmap</h1>
              <div style={{ fontSize: '0.8125rem', color: g.label, fontWeight: 600, marginTop: 4 }}>
                {filteredOutbreaks.length} outbreaks · {mapPoints.length} active clusters · Showing: {timeRange === 'all' ? 'All Time' : `Last ${timeRange.replace('h', ' Hours').replace('d', ' Days')}`}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
              <div style={{ display: 'flex', background: g.cardBg, padding: 4, borderRadius: 12, border: `1px solid ${g.cardBdr}`, gap: 4, boxShadow: g.cardShd }}>
                {[
                  { id: '24h', label: '24H' },
                  { id: '3d', label: '3D' },
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '1M' },
                  { id: 'all', label: 'All' },
                  { id: 'custom', label: 'Custom' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setTimeRange(opt.id)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 800, transition: 'all 0.2s',
                      background: timeRange === opt.id ? '#4f46e5' : 'transparent',
                      color: timeRange === opt.id ? '#fff' : g.label,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {timeRange === 'custom' && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: g.cardBg, padding: '0.75rem 1rem', borderRadius: 12, border: `1px solid ${g.cardBdr}`, boxShadow: g.cardShd, backdropFilter: g.blur, animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>Start Date</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ background: 'transparent', border: 'none', color: g.text, fontSize: '0.8125rem', fontWeight: 700, outline: 'none' }} />
                  </div>
                  <div style={{ width: 1, height: 24, background: g.divider }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>End Date</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ background: 'transparent', border: 'none', color: g.text, fontSize: '0.8125rem', fontWeight: 700, outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            input[type="date"]::-webkit-calendar-picker-indicator {
               filter: ${isDark ? 'invert(1)' : 'none'};
               cursor: pointer;
            }
          `}</style>
          <div style={{ flex: 1, background: g.cardBg, borderRadius: 24, border: `1px solid ${g.cardBdr}`, overflow: 'hidden', minHeight: 500, backdropFilter: g.blur }}>
            <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>Initializing Map...</div>}>
              <DistrictHeatmap district="India" points={mapPoints} center={INDIA_CENTER} zoom={5} bounds={INDIA_BOUNDS} outbreaks={filteredOutbreaks} height="100%" />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
