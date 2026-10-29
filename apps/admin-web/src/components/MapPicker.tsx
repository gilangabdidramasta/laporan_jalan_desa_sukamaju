import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { cn } from '../lib/format'
import { VILLAGE } from '../lib/village'

const pickerIcon = L.divIcon({
  className: 'picker-marker',
  html: '<span class="material-symbols-outlined">location_on</span>',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true })
  }, [lat, lng, map])
  return null
}

export function MapPicker({
  value,
  onChange,
  className,
  height = 320,
}: {
  value: { lat: number | null; lng: number | null }
  onChange: (lat: number, lng: number) => void
  className?: string
  height?: number
}) {
  const hasValue = value.lat !== null && value.lng !== null
  const center: [number, number] = hasValue
    ? [value.lat as number, value.lng as number]
    : [VILLAGE.center.lat, VILLAGE.center.lng]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border-strong',
        className,
      )}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={hasValue ? 16 : VILLAGE.zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler onPick={onChange} />
        {hasValue ? (
          <>
            <FlyTo lat={value.lat as number} lng={value.lng as number} />
            <Marker
              position={[value.lat as number, value.lng as number]}
              icon={pickerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const point = event.target.getLatLng()
                  onChange(point.lat, point.lng)
                },
              }}
            />
          </>
        ) : null}
      </MapContainer>

      {!hasValue ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-space-md">
          <span className="bg-on-surface/80 text-on-primary font-caption text-caption px-3 py-1.5 rounded-full">
            Ketuk peta untuk menandai titik jalan
          </span>
        </div>
      ) : null}
    </div>
  )
}
