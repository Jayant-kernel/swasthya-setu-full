import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ODISHA_COORDS = {
  'Koraput': [18.8135, 82.7134],
  'Malkangiri': [18.3500, 81.8833],
  'Rayagada': [19.1700, 83.4200],
  'Kalahandi': [19.9167, 83.1667],
  'Kandhamal': [20.4667, 84.2333],
  'Nabarangpur': [19.2333, 82.5500],
  'Mayurbhanj': [21.9500, 86.7333],
  'Bhubaneswar': [20.2961, 85.8245],
  'Cuttack': [20.4625, 85.8828],
  'Puri': [19.8135, 85.8312],
  'Berhampur': [19.3150, 84.7941],
  'Sambalpur': [21.4669, 83.9756],
  'Rourkela': [22.2604, 84.8536],
  'Balasore': [21.4942, 86.9335],
  'Boudh': [20.8393, 84.3275],
  'Dhenkanal': [20.6597, 85.5988],
  'Ganjam': [19.3833, 85.0500],
  'Kendrapara': [20.5006, 86.4200],
  'Keonjhar': [21.6288, 85.5817],
  'Khordha': [20.1824, 85.6218],
  'Nayagarh': [20.1289, 85.0956],
  'Nuapada': [20.8167, 82.5333],
  'Sonepur': [20.8333, 83.9167],
  'Sundargarh': [22.1167, 84.0333],
  'Angul': [20.8386, 85.1019],
  'Balangir': [20.7068, 83.4861],
  'Bargarh': [21.3356, 83.6194],
  'Bhadrak': [21.0577, 86.5155],
  'Deogarh': [21.5376, 84.7327],
  'Gajapati': [18.9949, 84.0982],
  'Jagatsinghpur': [20.2619, 86.1705],
  'Jajpur': [20.8490, 86.3352],
  'Jharsuguda': [21.8545, 84.0061],
  'Other': [20.9517, 85.0985],
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function circleColor(redCount) {
  if (redCount === 0) return { color: '#22c55e', radius: 8 }
  if (redCount <= 2) return { color: '#f59e0b', radius: 12 }
  if (redCount <= 5) return { color: '#ef4444', radius: 16 }
  return { color: '#7f1d1d', radius: 20 }
}

export default function DMODashboardPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const alertMarkersRef = useRef([])

  const dmoName = localStorage.getItem('dmoName') || 'Officer'
  const dmoDistrict = localStorage.getItem('dmoDistrict') || 'Odisha'
  const dmoId = localStorage.getItem('dmoId') || ''

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [todayTotal, setTodayTotal] = useState(0)
  const [redCount, setRedCount] = useState(0)
  const [sickleCount, setSickleCount] = useState(0)
  const [helplineCount, setHelplineCount] = useState(0)
  const [districtData, setDistrictData] = useState({})
  const [leaderboard, setLeaderboard] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [symptomChart, setSymptomChart] = useState([])
  const [outbreakAlerts, setOutbreakAlerts] = useState([])
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }, [])

  const fetchAll = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Fetch today's records
    const { data: todayRecs } = await supabase
      .from('triage_records')
      .select('id, severity, district, created_at, patient_name, symptoms, sickle_cell_risk, source, reviewed, brief')
      .gte('created_at', todayStr)
      .order('created_at', { ascending: false })

    if (todayRecs) {
      setTodayTotal(todayRecs.length)
      setRedCount(todayRecs.filter(r => r.severity === 'red').length)

      // Recent alerts (last 10 RED)
      const reds = todayRecs.filter(r => r.severity === 'red').slice(0, 10)
      setRecentAlerts(reds)
    }

    // Sickle cell last 7 days
    const { data: sickleRecs } = await supabase
      .from('triage_records')
      .select('id')
      .eq('sickle_cell_risk', true)
      .gte('created_at', last7)
    setSickleCount(sickleRecs?.length || 0)

    // Helpline unreviewed
    const { data: helplineRecs } = await supabase
      .from('triage_records')
      .select('id')
      .eq('source', 'helpline_call')
      .eq('reviewed', false)
    setHelplineCount(helplineRecs?.length || 0)

    // District heatmap (last 7 days)
    const { data: distRecs } = await supabase
      .from('triage_records')
      .select('district, severity, sickle_cell_risk, created_at')
      .gte('created_at', last7)

    if (distRecs) {
      const dd = {}
      distRecs.forEach(r => {
        const d = r.district || 'Other'
        if (!dd[d]) dd[d] = { total: 0, red: 0, yellow: 0, green: 0, sickle: 0, lastCase: null }
        dd[d].total++
        if (r.severity === 'red') dd[d].red++
        else if (r.severity === 'yellow') dd[d].yellow++
        else dd[d].green++
        if (r.sickle_cell_risk) dd[d].sickle++
        if (!dd[d].lastCase || new Date(r.created_at) > new Date(dd[d].lastCase)) {
          dd[d].lastCase = r.created_at
        }
      })
      setDistrictData(dd)

      // Leaderboard: sort by red desc
      const lb = Object.entries(dd)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.red - a.red)
      setLeaderboard(lb)

      // Outbreak alerts: districts with 3+ RED in last 24h
      const { data: alert24Recs } = await supabase
        .from('triage_records')
        .select('district, severity')
        .eq('severity', 'red')
        .gte('created_at', last24)

      if (alert24Recs) {
        const alertCounts = {}
        alert24Recs.forEach(r => {
          const d = r.district || 'Other'
          alertCounts[d] = (alertCounts[d] || 0) + 1
        })
        const alerts = Object.entries(alertCounts)
          .filter(([, cnt]) => cnt >= 3)
          .map(([district, count]) => ({ district, count }))
        setOutbreakAlerts(alerts)
      }
    }

    // Symptom frequency (last 7 days)
    const { data: sympRecs } = await supabase
      .from('triage_records')
      .select('symptoms')
      .gte('created_at', last7)

    if (sympRecs) {
      const counts = {}
      sympRecs.forEach(r => {
        if (Array.isArray(r.symptoms)) {
          r.symptoms.forEach(s => { counts[s] = (counts[s] || 0) + 1 })
        }
      })
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
      setSymptomChart(sorted)
    }

    setLastUpdated(new Date())
  }, [])

  // Initial fetch + 30s interval
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('triage_live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'triage_records',
      }, (payload) => {
        const r = payload.new
        setTodayTotal(prev => prev + 1)
        if (r.severity === 'red') {
          setRedCount(prev => prev + 1)
          setRecentAlerts(prev => [r, ...prev].slice(0, 10))
          setDistrictData(prev => {
            const d = r.district || 'Other'
            const cur = prev[d] || { total: 0, red: 0, yellow: 0, green: 0, sickle: 0, lastCase: null }
            return { ...prev, [d]: { ...cur, total: cur.total + 1, red: cur.red + 1, lastCase: r.created_at } }
          })
          showToast(`🔴 New emergency case in ${r.district || 'Unknown'}`)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [showToast])

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: true }).setView([20.9517, 85.0985], 7)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)
    mapInstanceRef.current = map
  }, [leafletLoaded])

  // Update map markers when districtData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    const L = window.L
    const map = mapInstanceRef.current

    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    Object.entries(districtData).forEach(([district, stats]) => {
      const coords = ODISHA_COORDS[district]
      if (!coords) return
      const { color, radius } = circleColor(stats.red)

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.75,
      }).addTo(map)

      circle.bindPopup(`
        <div style="font-family:sans-serif;min-width:160px">
          <b style="font-size:1rem">${district}</b><br/>
          <span style="color:#374151">Total cases: <b>${stats.total}</b></span><br/>
          <span style="color:#dc2626">🔴 RED: <b>${stats.red}</b></span><br/>
          <span style="color:#d97706">🟡 YELLOW: <b>${stats.yellow}</b></span><br/>
          <span style="color:#16a34a">🟢 GREEN: <b>${stats.green}</b></span><br/>
          <span style="color:#9333ea">💉 Sickle Cell: <b>${stats.sickle}</b></span>
        </div>
      `)

      markersRef.current.push(circle)
    })
  }, [districtData])

  function handleLogout() {
    localStorage.removeItem('dmoDistrict')
    localStorage.removeItem('dmoName')
    localStorage.removeItem('dmoId')
    navigate('/dmo-login')
  }

  const maxSymptom = symptomChart.length > 0 ? symptomChart[0].count : 1

  const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f1f5f9', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#dc2626',
            color: '#fff',
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9375rem',
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(220,38,38,0.5)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Outbreak Intelligence Dashboard
              </h1>
              <div
                style={{
                  fontFamily: "'Noto Sans Oriya', sans-serif",
                  color: '#64748b',
                  fontSize: '0.8125rem',
                }}
              >
                ରୋଗ ବ୍ୟାପ୍ତି ଡ୍ୟାସବୋର୍ଡ
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a' }}>
              Dr. {dmoName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              DMO · {dmoDistrict} · {dmoId}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.3)',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em' }}>
              LIVE
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            Updated {timeAgo(lastUpdated)}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Outbreak alerts */}
        {outbreakAlerts.filter(a => !dismissedAlerts.has(a.district)).map(alert => (
          <div
            key={alert.district}
            style={{
              background: '#dc2626',
              color: '#fff',
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            <span>
              🔴 OUTBREAK ALERT: {alert.district} — {alert.count} emergency cases in 24 hours
            </span>
            <button
              onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.district]))}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '0.25rem 0.625rem',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Summary stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <StatCard
            label="Total Cases Today"
            sublabel="ଆଜିର ମୋଟ ରୋଗୀ"
            value={todayTotal}
            bg="#f0fdf9"
            accent="#0d9488"
          />
          <StatCard
            label="RED Cases Today"
            sublabel="ଜରୁରୀ ରୋଗୀ"
            value={redCount}
            bg="#fef2f2"
            accent="#ef4444"
            pulse={redCount > 0}
          />
          <StatCard
            label="Sickle Cell (7d)"
            sublabel="ସିକେଲ ସେଲ (୭ ଦିନ)"
            value={sickleCount}
            bg="#fff7ed"
            accent="#f97316"
          />
          <StatCard
            label="Helpline Unreviewed"
            sublabel="ଅଣଦେଖା ହେଲ୍ପଲାଇନ"
            value={helplineCount}
            bg="#fefce8"
            accent="#ca8a04"
          />
        </div>

        {/* Map + Recent Alerts side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Map */}
          <div style={{ ...cardStyle, minHeight: '420px' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.875rem' }}>
              District Heatmap — Last 7 Days
            </div>
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '380px',
                borderRadius: '8px',
                background: '#e2e8f0',
              }}
            />
            {!leafletLoaded && (
              <div style={{ textAlign: 'center', color: '#64748b', paddingTop: '4rem' }}>
                Loading map…
              </div>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { color: '#22c55e', label: 'No RED cases' },
                { color: '#f59e0b', label: '1–2 RED' },
                { color: '#ef4444', label: '3–5 RED' },
                { color: '#7f1d1d', label: '6+ RED' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Recent alerts panel */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.875rem' }}>
              🔴 Recent Emergency Cases
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '430px', overflowY: 'auto' }}>
              {recentAlerts.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', paddingTop: '1rem', textAlign: 'center' }}>
                  No RED cases today
                </div>
              )}
              {recentAlerts.map((r, i) => (
                <div
                  key={r.id || i}
                  style={{
                    background: '#fef2f2',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    borderLeft: '3px solid #ef4444',
                    animation: i === 0 ? 'slideIn 0.4s ease' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                        {r.patient_name ? r.patient_name.split(' ')[0] : 'Patient'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.district}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        RED
                      </span>
                      <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                        {timeAgo(r.created_at)}
                      </div>
                    </div>
                  </div>
                  {r.brief && (
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.375rem', lineHeight: 1.4 }}>
                      {r.brief}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard + Symptom chart */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Leaderboard */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.875rem' }}>
              District Case Summary — Last 7 Days
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['District', 'Total', 'RED', 'YELLOW', 'GREEN', 'Sickle Cell', 'Last Case'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === 'District' ? 'left' : 'center',
                          padding: '0.5rem 0.75rem',
                          color: '#64748b',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr
                      key={row.name}
                      style={{
                        background: row.red > 2 ? '#fef2f2' : i % 2 === 0 ? 'transparent' : '#f8fafc',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '0.625rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                        {row.name}
                        {row.red > 2 && (
                          <span style={{ marginLeft: '0.375rem', fontSize: '0.7rem', color: '#ef4444' }}>⚠</span>
                        )}
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: '#475569' }}>{row.total}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: row.red > 0 ? '#ef4444' : '#64748b', fontWeight: row.red > 0 ? 700 : 400 }}>{row.red}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: row.yellow > 0 ? '#f59e0b' : '#64748b' }}>{row.yellow}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: row.green > 0 ? '#22c55e' : '#64748b' }}>{row.green}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: row.sickle > 0 ? '#a855f7' : '#64748b' }}>{row.sickle}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {row.lastCase ? timeAgo(row.lastCase) : '—'}
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No data for last 7 days
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Symptom chart */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.875rem' }}>
              Top Symptoms — Last 7 Days
            </div>
            {symptomChart.length === 0 && (
              <div style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', paddingTop: '2rem' }}>
                No symptom data available
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {symptomChart.map(({ name, count }) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#374151', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                      {name}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(count / maxSymptom) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0F6E56, #0d9488)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, sublabel, value, bg, accent, pulse }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: '12px',
        padding: '1.25rem',
        border: pulse ? `2px solid ${accent}` : '2px solid transparent',
        animation: pulse ? 'pulseBorder 2s infinite' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: accent, lineHeight: 1, marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.3 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Noto Sans Oriya', sans-serif",
          color: '#94a3b8',
          fontSize: '0.75rem',
          marginTop: '0.25rem',
        }}
      >
        {sublabel}
      </div>
      <style>{`
        @keyframes pulseBorder {
          0%, 100% { border-color: ${accent}; }
          50% { border-color: transparent; }
        }
      `}</style>
    </div>
  )
}
