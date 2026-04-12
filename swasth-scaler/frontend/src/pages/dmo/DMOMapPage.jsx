import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import DMOSidebar from '../../components/DMOSidebar'
import { SunIcon, MoonIcon } from '../admin/AdminIcons'
import { API, DISTRICT_CENTERS, DISTRICT_BOUNDS, buildMapPoints } from './DMOShared'

const DistrictHeatmap = lazy(() => import('../../components/DistrictHeatmap'))

export default function DMOMapPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [triageRecords, setTriageRecords] = useState([])
  const [outbreaks, setOutbreaks] = useState([])
  const [loading, setLoading] = useState(true)

  const _savedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const dmoDistrict = _savedUser.district || 'Pune'
  const center = DISTRICT_CENTERS[dmoDistrict] || [18.5204, 73.8567]
  const bounds = DISTRICT_BOUNDS[dmoDistrict] || null

  const g = useMemo(() => ({
    text: 'var(--g-text)', muted: 'var(--g-muted)', accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)', cardBdr: 'var(--g-card-bdr)', cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)', blur: 'var(--g-blur)'
  }), [isDark])

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
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const mapPoints = useMemo(() => buildMapPoints(triageRecords, center), [triageRecords, center])
  const districtOutbreaks = useMemo(() => outbreaks.filter(o => o.district?.toLowerCase() === dmoDistrict.toLowerCase()), [outbreaks, dmoDistrict])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <DMOSidebar isHovered={isHovered} setIsHovered={setIsHovered} onLogout={() => {logout(); navigate('/')}} onAdminNav={() => navigate('/dashboard/admin')} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: g.text }}>District Map — {dmoDistrict}</h2>
            <div style={{ fontSize: '0.75rem', color: g.muted, marginTop: 2 }}>{loading ? 'Syncing data...' : `${mapPoints.length} clusters · ${districtOutbreaks.length} outbreaks`}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>M</div>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>Loading Heatmap...</div>}>
            <DistrictHeatmap district={dmoDistrict} points={mapPoints} center={center} bounds={bounds} outbreaks={districtOutbreaks} height="100%" />
          </Suspense>

          <div style={{ position: 'absolute', bottom: 24, right: 24, background: g.cardBg, borderRadius: 12, padding: '1rem 1.25rem', boxShadow: g.cardShd, zIndex: 1000, fontSize: '0.75rem', border: `1px solid ${g.cardBdr}`, backdropFilter: g.blur }}>
            <div style={{ fontWeight: 800, color: g.text, marginBottom: 8 }}>Heatmap Legend</div>
            {[
              { color: '#ef4444', label: 'Critical' },
              { color: '#f59e0b', label: 'Moderate' },
              { color: '#22c55e', label: 'Stable' },
              { color: '#8b5cf6', label: 'Outbreak', dashed: true },
            ].map(({ color, label, dashed }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: dashed ? `2px dashed ${color}` : 'none' }} />
                <span style={{ color: g.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
