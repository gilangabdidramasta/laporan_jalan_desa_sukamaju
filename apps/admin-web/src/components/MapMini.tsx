import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer, Popup } from 'react-leaflet'
import { formatCoordinate } from '../lib/format'

const pinIcon = L.divIcon({
  className: 'report-marker',
  html: '<span class="material-symbols-outlined">location_on</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -28],
})

export function MapMini({
  latitude,
  longitude,
  label,
  height = 240,
}: {
  latitude: number
  longitude: number
  label?: string
  height?: number
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border-subtle"
      style={{ height }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={[latitude, longitude]} icon={pinIcon}>
          <Popup>
            <div className="font-body-sm text-body-sm">
              <p className="font-bold">{label ?? 'Lokasi laporan'}</p>
              <p className="text-on-surface-variant text-caption">
                {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
