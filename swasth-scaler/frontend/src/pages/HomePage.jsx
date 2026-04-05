import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TopNav from '../components/TopNav.jsx'
import GlobalHeader from '../components/GlobalHeader.jsx'

const ALL_DISTRICTS = [
  "Ahilyanagar",
  "Akola",
  "Amravati",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Chhatrapati Sambhajinagar",
  "Dharashiv",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal"
]

const SEVERITY_ORDER = { red: 0, yellow: 1, green: 2 }
const TEAL = 'var(--primary)'   // eSanjeevani teal-green
const BLUE_BG = 'var(--bg)' // Responsive dashboard background

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Utility removed as Triage counts now reflect the full patient list, not just today's.

export default function HomePage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('ALL')
  const [sortMode, setSortMode] = useState('latest')
  const [query, setQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const debounceRef = useRef(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // State declarations — all must be before any useEffect that references them
  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [showCount, setShowCount] = useState(6)
  const [dashError, setDashError] = useState(null)

  // Summary counts per severity
  const [summaryCounts, setSummaryCounts] = useState({ red: 0, yellow: 0, green: 0 })

  // Online/offline listener
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Update summary counts whenever patient list changes
  useEffect(() => {
    const counts = { red: 0, yellow: 0, green: 0 }
    patientResults.forEach(p => {
      // Use latestSeverity which is pre-calculated in fetchRecords
      if (p.latestSeverity && counts[p.latestSeverity] !== undefined) {
        counts[p.latestSeverity]++
      }
    })
    setSummaryCounts(counts)
  }, [patientResults])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      // Try patients table first (grouped view)
      let q = supabase
        .from('patients')
        .select('*, triage_records(id, severity, brief, created_at, district)')
        .order('created_at', { ascending: false })

      if (query.trim().length >= 2) q = q.ilike('name', `%${query.trim()}%`)
      if (districtFilter) q = q.eq('district', districtFilter)

      const { data, error } = await q

      if (!error && data && data.length > 0) {
        // Patients table exists and has data — use grouped view
        let patients = data.map(p => {
          const sorted = [...(p.triage_records || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          return { ...p, triage_records: sorted, latestSeverity: sorted[0]?.severity || null }
        }).filter(p => p.triage_records.length > 0)

        if (activeTab !== 'ALL') {
          patients = patients.filter(p => p.latestSeverity === activeTab.toLowerCase())
        }
        if (sortMode === 'critical') {
          patients.sort((a, b) => (SEVERITY_ORDER[a.latestSeverity] ?? 3) - (SEVERITY_ORDER[b.latestSeverity] ?? 3))
        }

        setPatientResults(patients)
        setTotalCount(patients.length)
        setShowCount(6)
        setLoading(false)
        return
      }

      // Fallback: patients table empty or doesn't exist — query triage_records directly
      // and group them by patient_name+age+district
      let tq = supabase
        .from('triage_records')
        .select('id, patient_id, patient_name, age, gender, district, severity, created_at, symptom_text, brief')
        .order('created_at', { ascending: false })

      if (activeTab !== 'ALL') tq = tq.eq('severity', activeTab.toLowerCase())
      if (query.trim().length >= 2) tq = tq.ilike('patient_name', `%${query.trim()}%`)
      if (districtFilter) tq = tq.eq('district', districtFilter)

      const { data: records } = await tq
      const rows = records || []

      // Group by patient key (name+age+district)
      const grouped = new Map()
      for (const r of rows) {
        const key = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.district}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: r.patient_id || key,
            name: r.patient_name,
            age: r.age,
            gender: r.gender,
            district: r.district,
            triage_records: [],
          })
        }
        grouped.get(key).triage_records.push({ id: r.id, severity: r.severity, brief: r.brief, created_at: r.created_at, district: r.district })
      }

      let patients = Array.from(grouped.values()).map(p => {
        p.triage_records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        p.latestSeverity = p.triage_records[0]?.severity || null
        return p
      })

      if (sortMode === 'critical') {
        patients.sort((a, b) => (SEVERITY_ORDER[a.latestSeverity] ?? 3) - (SEVERITY_ORDER[b.latestSeverity] ?? 3))
      }

      setPatientResults(patients)
      setTotalCount(patients.length)
      setShowCount(6)
    } catch (err) {
      console.error('fetchRecords error:', err)
      setDashError(err?.message || 'Unknown error')
      setPatientResults([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [activeTab, query, districtFilter, sortMode])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchRecords()
    }, query ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [activeTab, query, districtFilter, sortMode, fetchRecords])

  function handlePatientCardClick(p) {
    navigate('/patient', { state: { prefill: { name: p.name, age: p.age, gender: p.gender, district: p.district }, patientId: p.id } })
  }

  async function handleDeletePatient(e, patientId) {
    e.stopPropagation()
    if (!window.confirm('Delete ALL records for this patient? This cannot be undone.')) return
    // delete triage records first, then patient
    await supabase.from('triage_records').delete().eq('patient_id', patientId)
    await supabase.from('patients').delete().eq('id', patientId)
    setPatientResults(prev => prev.filter(p => p.id !== patientId))
    setTotalCount(prev => prev - 1)
  }

  const visiblePatients = patientResults.slice(0, showCount)

  return (
    <div style={{ minHeight: '100dvh', background: BLUE_BG, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <GlobalHeader />

      <TopNav />

      <main style={{ flex: 1, padding: '1rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Today's summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
             { sev: 'red', label: 'तातडीने', sub: 'Emergency', accent: '#C0392B', count: summaryCounts.red },
            { sev: 'yellow', label: 'मध्यम', sub: 'Moderate', accent: '#B7791F', count: summaryCounts.yellow },
            { sev: 'green', label: 'स्थिर', sub: 'Stable', accent: 'var(--primary)', count: summaryCounts.green },
          ].map(item => (
            <button key={item.sev}
              onClick={() => setActiveTab(activeTab === item.sev.toUpperCase() ? 'ALL' : item.sev.toUpperCase())}
              style={{
                background: activeTab === item.sev.toUpperCase() ? item.accent : 'var(--surface)',
                border: `1.5px solid ${activeTab === item.sev.toUpperCase() ? item.accent : 'var(--border)'}`,
                borderRadius: 10, padding: '0.875rem 0.5rem', textAlign: 'center',
                cursor: 'pointer', minHeight: 72, transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: activeTab === item.sev.toUpperCase() ? 'var(--surface)' : item.accent }}>{item.count}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: 3, color: activeTab === item.sev.toUpperCase() ? 'rgba(255,255,255,0.9)' : 'var(--text-main)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{item.label}</div>
              <div style={{ fontSize: '0.6875rem', color: activeTab === item.sev.toUpperCase() ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '1rem', alignItems: 'center' }}>


          {/* Sort */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {[{ key: 'latest', label: 'Latest' }, { key: 'critical', label: 'Critical first' }].map(s => (
              <button key={s.key} onClick={() => setSortMode(s.key)}
                style={{
                  minHeight: 44, padding: '0 0.875rem', border: 'none',
                  borderRight: s.key === 'latest' ? '1px solid var(--border)' : 'none',
                  background: sortMode === s.key ? TEAL : 'transparent',
                  color: sortMode === s.key ? 'var(--surface)' : 'var(--text-main)',
                  fontWeight: sortMode === s.key ? 700 : 500,
                  fontSize: '0.875rem', cursor: 'pointer',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* District */}
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
            style={{ minHeight: 44, padding: '0 2rem 0 0.75rem', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-main)', flex: '1 1 140px', minWidth: 0 }}>
            <option value="">All Districts</option>
            {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 140px', minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
            <input type="text"
              style={{ minHeight: 44, paddingLeft: '2rem', paddingRight: '0.75rem', width: '100%', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Search by name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Patient count */}
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {loading ? 'Loading…' : `${totalCount} patient${totalCount !== 1 ? 's' : ''} found`}
        </div>

        {/* Error state */}
        {dashError && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.75rem', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>काहीतरी चूक झाली / Something went wrong</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{dashError}</div>
            <button onClick={() => { setDashError(null); fetchRecords() }}
              style={{ minHeight: 44, padding: '0 1.5rem', background: TEAL, color: 'var(--surface)', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              पुन्हा प्रयत्न करा / Retry
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && patientResults.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', opacity: 0.5 }}>
                <div style={{ height: 16, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '60%' }} />
                <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 8, width: '40%' }} />
                <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '80%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && patientResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
            कोणतेही रुग्ण आढळले नाहीत<br /><span style={{ fontSize: '0.875rem' }}>No patients found.</span>
          </div>
        )}

        {/* ── Patient cards (grouped by patient) ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {visiblePatients.map(p => {
            const last = p.triage_records?.[0]
            const sev = last?.severity
            const sevColor = sev === 'red' ? '#C0392B' : sev === 'yellow' ? '#B7791F' : 'var(--primary)'
            const sevLabel = sev === 'red' ? 'EMERGENCY' : sev === 'yellow' ? 'MODERATE' : sev ? 'STABLE' : null
            const visits = p.triage_records || []
            // Severity trend: last 3 visits (oldest → newest for left-to-right reading)
            const trendDots = visits.slice(0, 3).reverse()
            return (
              <div key={p.id}
                style={{ background: 'var(--surface)', border: '1px solid #d1e8e2', borderLeft: `5px solid ${sevColor}`, borderRadius: 10, padding: '1rem', transition: 'box-shadow 0.15s', boxShadow: '0 1px 3px rgba(26,110,92,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,110,92,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(26,110,92,0.06)' }}
              >
                {/* Top row: name + delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <button onClick={() => handlePatientCardClick(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', flex: 1 }}
                  >
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: sevColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{p.name}</span>
                  </button>
                  <button onClick={(e) => handleDeletePatient(e, p.id)}
                    title="Delete patient"
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0, marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-bg)'; e.currentTarget.style.color = 'var(--error-text)'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                </div>

                {/* Clickable body */}
                <button onClick={() => handlePatientCardClick(p)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                >
                  {/* Severity pill + meta + visit count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    {sevLabel && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: sevColor, background: `color-mix(in srgb, ${sevColor} 15%, transparent)`, border: `1px solid ${sevColor}40`, borderRadius: 4, padding: '0.1rem 0.4rem', letterSpacing: '0.04em' }}>
                        {sevLabel}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {[p.age && `${p.age} yrs`, p.gender, p.district].filter(Boolean).join(' · ')}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: TEAL, background: `color-mix(in srgb, ${TEAL} 12%, transparent)`, border: `1px solid ${TEAL}30`, borderRadius: 4, padding: '0.1rem 0.4rem' }}>
                      {visits.length} visit{visits.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Severity trend dots (if >1 visit) */}
                  {trendDots.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Trend:</span>
                      {trendDots.map((t, i) => {
                        const dotColor = t.severity === 'red' ? '#C0392B' : t.severity === 'yellow' ? '#B7791F' : 'var(--primary)'
                        return (
                          <React.Fragment key={t.id}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, border: `1.5px solid ${dotColor}` }} title={`${t.severity} — ${new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} />
                            {i < trendDots.length - 1 && <span style={{ fontSize: '0.6rem', color: 'var(--border)' }}>→</span>}
                          </React.Fragment>
                        )
                      })}
                    </div>
                  )}

                  {/* Brief */}
                  {last?.brief && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.375rem' }}>
                      {last.brief}
                    </div>
                  )}

                  {/* Time */}
                  {last && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Last visit: {timeAgo(last.created_at)}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Show more */}
        {patientResults.length > showCount && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button onClick={() => setShowCount(c => c + 6)}
              style={{ minHeight: 48, padding: '0 2rem', background: 'var(--surface)', border: `1.5px solid ${TEAL}`, color: TEAL, borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer' }}>
              आणखी पहा / Show more ({patientResults.length - showCount} remaining)
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
