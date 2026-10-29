import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { cn, formatDate, formatTicket } from '../lib/format'
import { VILLAGE } from '../lib/village'
import type { Report } from '../lib/types'
import { DamageChips } from './DamageChips'

const markerIcon = L.divIcon({
  className: 'report-marker',
  html: '<span class="material-symbols-outlined">location_on</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -30],
})

const centerIcon = L.divIcon({
  className: 'center-marker',
  html: '<span class="center-marker__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function FitBounds({ reports }: { reports: Report[] }) {
  const map = useMap()
  const key = reports
    .map((report) => `${report.id}:${report.latitude}:${report.longitude}`)
    .join('|')

  useEffect(() => {
    if (reports.length === 0) return
    const bounds = L.latLngBounds(
      reports.map((report) => [report.latitude, report.longitude] as [number, number]),
    )
    map.fitBounds(bounds.pad(0.25), { maxZoom: 16, animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])

  return null
}

function RecenterButton({ reports }: { reports: Report[] }) {
  const map = useMap()

  return (
    <button
      type="button"
      onClick={() => {
        if (reports.length > 0) {
          const bounds = L.latLngBounds(
            reports.map(
              (report) => [report.latitude, report.longitude] as [number, number],
            ),
          )
          map.fitBounds(bounds.pad(0.25), { maxZoom: 16, animate: true })
        } else {
          map.setView([VILLAGE.center.lat, VILLAGE.center.lng], VILLAGE.zoom)
        }
      }}
      className="absolute top-3 right-3 z-[400] h-10 px-3 rounded-md bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center gap-1.5 shadow-card"
      aria-label="Pusatkan peta ke lokasi kota"
    >
      <span className="material-symbols-outlined text-[18px]">my_location</span>
      <span className="hidden sm:inline font-label-md text-label-md">Pusatkan</span>
    </button>
  )
}

export function MapView({
  reports,
  height = 420,
  zoom = VILLAGE.zoom,
  showRecenter = true,
  className,
  rounded = 'rounded-lg',
}: {
  reports: Report[]
  height?: number
  zoom?: number
  showRecenter?: boolean
  className?: string
  rounded?: string
}) {
  const center = useMemo<[number, number]>(() => {
    if (reports.length === 0) return [VILLAGE.center.lat, VILLAGE.center.lng]
    const lat =
      reports.reduce((sum, report) => sum + report.latitude, 0) / reports.length
    const lng =
      reports.reduce((sum, report) => sum + report.longitude, 0) / reports.length
    return [lat, lng]
  }, [reports])

  return (
    <div
      className={cn('relative isolate overflow-hidden border border-border-subtle', rounded, className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <Marker
          position={[VILLAGE.center.lat, VILLAGE.center.lng]}
          icon={centerIcon}
          interactive={false}
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={markerIcon}
            title={report.alamat}
          >
            <Popup>
              <div className="w-56">
                {report.photos[0] ? (
                  <img
                    src={report.photos[0]}
                    alt={`Foto kerusakan jalan di ${report.alamat}`}
                    className="w-full h-24 object-cover rounded-md mb-2"
                    loading="lazy"
                  />
                ) : null}
                <span className="font-ticket text-ticket-code text-secondary font-bold tabular-nums">
                  {formatTicket(report.ticketCode)}
                </span>
                <p className="text-[13px] font-semibold leading-snug mt-0.5">
                  {report.alamat}
                </p>
                <div className="mt-1.5">
                  <DamageChips types={report.damageTypes} size="sm" />
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border-subtle">
                  <span className="text-[11px] text-on-surface-variant">
                    {formatDate(report.createdAt)}
                  </span>
                  <Link
                    to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
                    className="text-[11px] text-primary font-bold inline-flex items-center"
                  >
                    Lihat Detail
                    <span className="material-symbols-outlined text-[13px]">
                      chevron_right
                    </span>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds reports={reports} />
        {showRecenter ? <RecenterButton reports={reports} /> : null}
      </MapContainer>
    </div>
  )
}
