import React, { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function getSeverityColor(point) {
  if (point.critical > 0) return '#ef4444'
  if (point.moderate > 0) return '#f59e0b'
  return '#22c55e'
}

function MapController({ center, zoom, bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      // Use setView with the district center + zoom — no fitBounds (that's what caused world view)
      map.setView(center, zoom, { animate: true })
      map.setMaxBounds(bounds)
      map.setMinZoom(9)
    } else {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, zoom, bounds, map])
  return null
}

export default function DistrictHeatmap({ district, points, center, zoom = 10, bounds, height = '420px' }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={bounds ? 9 : 5}
      maxZoom={14}
      maxBounds={bounds || undefined}
      maxBoundsViscosity={bounds ? 1.0 : 0}
      style={{ height, width: '100%', borderRadius: '10px', zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapController center={center} zoom={zoom} bounds={bounds} />
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={[pt.lat, pt.lng]}
          radius={Math.max(10, Math.min(40, pt.total * 5))}
          pathOptions={{
            fillColor:    getSeverityColor(pt),
            fillOpacity:  0.75,
            color:        getSeverityColor(pt),
            weight:       2,
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px', fontSize: '0.875rem' }}>
              <strong style={{ fontSize: '1rem' }}>{pt.village}</strong>
              <hr style={{ margin: '6px 0' }} />
              <div>Total Cases: <strong>{pt.total}</strong></div>
              <div style={{ color: '#ef4444' }}>Critical: {pt.critical}</div>
              <div style={{ color: '#f59e0b' }}>Moderate: {pt.moderate}</div>
              <div style={{ color: '#22c55e' }}>Mild: {pt.mild}</div>
              <hr style={{ margin: '6px 0' }} />
              <div style={{ color: '#64748b' }}>Last reported: {pt.lastReported}</div>
              {pt.ashaWorker && <div style={{ color: '#64748b' }}>ASHA: {pt.ashaWorker}</div>}
              {pt.lat && pt.lng && (
                <div style={{ color: '#2563eb', marginTop: '6px', fontWeight: 'bold' }}>
                  📍 {Number(pt.lat).toFixed(5)}, {Number(pt.lng).toFixed(5)}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
