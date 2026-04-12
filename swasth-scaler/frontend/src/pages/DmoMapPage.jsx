import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { DISTRICT_CENTERS, DISTRICT_BOUNDS, buildMapPoints, DMOSidebar } from './DMODashboardPage'

const API = 'https://swasthya-setu-full.onrender.com/api/v1'

const DistrictHeatmap = lazy(() =>
    import('../components/DistrictHeatmap').catch(err => {
        console.error('Chunk load error:', err)
        const hasReloaded = window.sessionStorage.getItem('heatmap_reload_attempted')
        if (!hasReloaded) {
            window.sessionStorage.setItem('heatmap_reload_attempted', 'true')
            window.location.reload()
        }
        return {
            default: () => (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <h3>Map failed to load</h3>
                    <button onClick={() => window.location.reload()}>Refresh</button>
                </div>
            )
        }
    })
)

export default function DMOMapPage() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [isHovered, setIsHovered] = useState(false)

    const _savedUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
    }, [])
    const dmoDistrict = _savedUser.district || 'Pune'
    const center = DISTRICT_CENTERS[dmoDistrict] || [18.5204, 73.8567]
    const bounds = DISTRICT_BOUNDS[dmoDistrict] || null

    const [triageRecords, setTriageRecords] = useState([])
    const [outbreaks, setOutbreaks] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token')
            const headers = { 'Authorization': `Bearer ${token}` }
            const [triRes, outRes] = await Promise.allSettled([
                fetch(`${API}/triage_records/`, { headers }),
                fetch(`${API}/outbreaks/`, { headers }),
            ])
            if (triRes.status === 'fulfilled' && triRes.value.ok) setTriageRecords(await triRes.value.json())
            if (outRes.status === 'fulfilled' && outRes.value.ok) {
                const data = await outRes.value.json()
                setOutbreaks(Array.isArray(data) ? data : [])
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const mapPoints = useMemo(() => buildMapPoints(triageRecords, center), [triageRecords, center])

    // Filter outbreaks for this district client-side
    const districtOutbreaks = useMemo(() =>
        outbreaks.filter(o => o.district?.toLowerCase() === dmoDistrict.toLowerCase()),
        [outbreaks, dmoDistrict]
    )

    return (
        <div style={{ minHeight: '100dvh', background: '#f8fafc', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
            <style>{`
        * { box-sizing: border-box; }
        .nav-link:hover { background: #f1f5f9; color: #3b82f6; }
        .nav-link.active { background: #ebf5ff; color: #3b82f6; font-weight: 700; border-left: 3px solid #3b82f6; }
      `}</style>

            <DMOSidebar
                activeView="map"
                setActiveView={(v) => { if (v === 'home') navigate('/dashboard/dmo') }}
                isHovered={isHovered}
                setIsHovered={setIsHovered}
                savedUser={_savedUser}
                onLogout={() => { logout(); navigate('/') }}
                onAdminNav={() => navigate('/dashboard/admin')}
            />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
                {/* Header */}
                <header style={{ height: 72, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                            District Map — {dmoDistrict}
                        </h2>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                            {loading ? 'Loading...' : `${mapPoints.length} triage clusters · ${districtOutbreaks.length} outbreak records`}
                        </div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                        {(_savedUser.full_name || 'D')[0]}
                    </div>
                </header>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.9375rem' }}>
                            Loading map data...
                        </div>
                    ) : (
                        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading map...</div>}>
                            <DistrictHeatmap
                                district={dmoDistrict}
                                points={mapPoints}
                                center={center}
                                bounds={bounds}
                                outbreaks={districtOutbreaks}
                                height="100%"
                            />
                        </Suspense>
                    )}

                    {/* Legend */}
                    <div style={{ position: 'absolute', bottom: 24, right: 24, background: '#fff', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 1000, fontSize: '0.75rem', pointerEvents: 'none' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Legend</div>
                        {[
                            { color: '#ef4444', label: 'Critical triage' },
                            { color: '#f59e0b', label: 'Moderate triage' },
                            { color: '#22c55e', label: 'Mild triage' },
                            { color: '#8b5cf6', label: 'Disease outbreak', dashed: true },
                        ].map(({ color, label, dashed }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: dashed ? `2px dashed ${color}` : 'none', flexShrink: 0 }} />
                                <span style={{ color: '#475569' }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}