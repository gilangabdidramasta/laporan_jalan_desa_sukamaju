import type { AccountStatus, NewsStatus, ReportStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { cn } from '../lib/format'

const REPORT_STYLE: Record<ReportStatus, string> = {
  PENDING: 'bg-status-pending-soft text-status-pending',
  PROSES: 'bg-secondary-soft text-secondary',
  DIPERBAIKI: 'bg-status-approved-soft text-status-approved',
  DITOLAK: 'bg-status-rejected-soft text-status-rejected',
  DITARIK: 'bg-status-withdrawn-soft text-status-withdrawn',
}

const REPORT_ICON: Record<ReportStatus, string> = {
  PENDING: 'schedule',
  PROSES: 'construction',
  DIPERBAIKI: 'check_circle',
  DITOLAK: 'cancel',
  DITARIK: 'undo',
}

export function ReportStatusBadge({
  status,
  compact = false,
}: {
  status: ReportStatus
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-label-md text-label-md font-semibold whitespace-nowrap',
        compact ? 'px-2 py-0.5 text-caption' : 'px-2.5 py-1',
        REPORT_STYLE[status],
      )}
    >
      <span className="material-symbols-outlined text-[14px]">
        {REPORT_ICON[status]}
      </span>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-caption text-caption font-semibold',
        status === 'AKTIF'
          ? 'bg-status-approved-soft text-status-approved'
          : 'bg-status-withdrawn-soft text-status-withdrawn',
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

export function NewsStatusBadge({ status }: { status: NewsStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-caption text-caption font-semibold',
        status === 'TERBIT'
          ? 'bg-status-approved-soft text-status-approved'
          : 'bg-surface-container-high text-on-surface-variant',
      )}
    >
      <span className="material-symbols-outlined text-[14px]">
        {status === 'TERBIT' ? 'public' : 'edit_note'}
      </span>
      {status === 'TERBIT' ? 'Terbit' : 'Draf'}
    </span>
  )
}

export function RoleBadge({ role }: { role: 'ADMIN' | 'SUPER_ADMIN' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-caption text-caption font-bold',
        role === 'SUPER_ADMIN'
          ? 'bg-secondary-soft text-secondary'
          : 'bg-primary-soft text-primary-hover',
      )}
    >
      <span className="material-symbols-outlined text-[14px]">
        {role === 'SUPER_ADMIN' ? 'shield_person' : 'badge'}
      </span>
      {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
    </span>
  )
}
