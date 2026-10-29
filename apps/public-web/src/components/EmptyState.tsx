import { Link } from 'react-router-dom'
import { cn } from '../lib/format'

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
}: {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-space-md py-space-xl',
        className,
      )}
    >
      <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/70 mb-space-md">
        <span className="material-symbols-outlined text-[38px]">{icon}</span>
      </div>
      <h3 className="font-title text-title text-on-surface font-bold">{title}</h3>
      {description ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-space-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      {actionLabel && (actionTo || onAction) ? (
        actionTo ? (
          <Link
            to={actionTo}
            className="mt-space-md inline-flex items-center gap-2 min-h-[44px] px-5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-label-md text-label-md font-semibold shadow-card transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-space-md inline-flex items-center gap-2 min-h-[44px] px-5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-label-md text-label-md font-semibold shadow-card transition-colors"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  )
}
