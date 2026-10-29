import type { ReportStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { cn } from '../lib/format'

const STYLES: Record<
  ReportStatus,
  { bg: string; text: string; dot: string; icon: string }
> = {
  PENDING: {
    bg: 'bg-status-pending-soft',
    text: 'text-status-pending',
    dot: 'bg-status-pending',
    icon: 'schedule',
  },
  PROSES: {
    bg: 'bg-secondary-soft',
    text: 'text-secondary',
    dot: 'bg-secondary',
    icon: 'construction',
  },
  DIPERBAIKI: {
    bg: 'bg-status-approved-soft',
    text: 'text-status-approved',
    dot: 'bg-status-approved',
    icon: 'check_circle',
  },
  DITOLAK: {
    bg: 'bg-status-rejected-soft',
    text: 'text-status-rejected',
    dot: 'bg-status-rejected',
    icon: 'cancel',
  },
  DITARIK: {
    bg: 'bg-status-withdrawn-soft',
    text: 'text-status-withdrawn',
    dot: 'bg-status-withdrawn',
    icon: 'undo',
  },
}

export function StatusBadge({
  status,
  size = 'md',
  withIcon = false,
  className,
}: {
  status: ReportStatus
  size?: 'sm' | 'md'
  withIcon?: boolean
  className?: string
}) {
  const style = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-label-md',
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px] leading-4'
          : 'px-3 py-1 text-label-md',
        style.bg,
        style.text,
        className,
      )}
    >
      {withIcon ? (
        <span className="material-symbols-outlined text-[14px]">{style.icon}</span>
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}
