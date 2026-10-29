import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: { label: string; to?: string; onClick?: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 gap-2">
      <span className="material-symbols-outlined text-[44px] text-outline-variant">
        {icon}
      </span>
      <p className="font-title text-title font-bold text-on-surface">{title}</p>
      {description ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? (
        action.to ? (
          <Link
            to={action.to}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover transition-colors"
          >
            {action.label}
          </button>
        )
      ) : null}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  children,
}: {
  message: string
  onRetry: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 gap-2">
      <span className="material-symbols-outlined text-[44px] text-status-rejected">
        cloud_off
      </span>
      <p className="font-title text-title font-bold text-on-surface">
        Gagal memuat data
      </p>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border-strong px-4 py-2 font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        Coba lagi
      </button>
      {children}
    </div>
  )
}
