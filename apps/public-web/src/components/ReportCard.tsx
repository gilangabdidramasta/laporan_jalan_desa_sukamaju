import { Link } from 'react-router-dom'
import { formatDate, formatTicket } from '../lib/format'
import type { Report } from '../lib/types'
import { DamageChips } from './DamageChips'
import { StatusBadge } from './StatusBadge'

export function ReportCard({
  report,
  showStatus = false,
  footer,
}: {
  report: Report
  showStatus?: boolean
  footer?: React.ReactNode
}) {
  return (
    <article className="group flex flex-col rounded-lg border border-border-subtle bg-surface-container-lowest shadow-card overflow-hidden transition-shadow duration-200 hover:shadow-card-hover">
      <Link
        to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
        className="block relative aspect-[4/3] overflow-hidden bg-surface-container"
      >
        {report.photos[0] ? (
          <img
            src={report.photos[0]}
            alt={`Kerusakan jalan di ${report.alamat}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/60">
            <span className="material-symbols-outlined text-[40px]">image_not_supported</span>
          </div>
        )}
        {report.photos.length > 1 ? (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-on-surface/70 text-on-primary font-caption text-[11px] px-2 py-0.5">
            <span className="material-symbols-outlined text-[13px]">photo_library</span>
            {report.photos.length}
          </span>
        ) : null}
        {showStatus ? (
          <span className="absolute top-2 left-2">
            <StatusBadge status={report.status} size="sm" withIcon />
          </span>
        ) : null}
      </Link>

      <div className="p-space-md flex flex-col gap-space-xs flex-1">
        <div className="flex items-center justify-between gap-space-sm">
          <span className="font-ticket text-ticket-code text-secondary font-bold tabular-nums truncate">
            {formatTicket(report.ticketCode)}
          </span>
          <span className="font-caption text-caption text-on-surface-variant shrink-0">
            {formatDate(report.createdAt)}
          </span>
        </div>

        <h3 className="font-title text-title text-on-surface leading-snug line-clamp-2">
          <Link
            to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
            className="hover:text-primary transition-colors"
          >
            {report.alamat}
          </Link>
        </h3>

        <DamageChips types={report.damageTypes} size="sm" />

        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
          {report.deskripsi}
        </p>

        {report.status === 'DITOLAK' && report.rejectionReason ? (
          <div className="mt-1 rounded-md bg-status-rejected-soft px-3 py-2">
            <p className="font-caption text-caption text-status-rejected font-semibold">
              Alasan penolakan
            </p>
            <p className="font-caption text-caption text-status-rejected/90 leading-relaxed mt-0.5">
              {report.rejectionReason}
            </p>
          </div>
        ) : null}

        {report.status === 'DITARIK' ? (
          <div className="mt-1 rounded-md bg-status-withdrawn-soft px-3 py-2">
            <p className="font-caption text-caption text-status-withdrawn leading-relaxed">
              Laporan ini telah ditarik dari publikasi oleh Admin Kota.
            </p>
          </div>
        ) : null}

        {footer ? (
          <div className="mt-auto pt-space-sm border-t border-border-subtle flex items-center justify-between gap-space-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  )
}
