import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/format'

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'primary',
  loading = false,
  confirmDisabled = false,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
  confirmDisabled?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  children?: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      containerRef.current
        ?.querySelector<HTMLElement>('button, input, textarea, select')
        ?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      window.clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px]"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-card-hover animate-fade-up max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {title}
            </h2>
            {description ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {children ? <div className="px-5 pt-4 flex flex-col gap-3">{children}</div> : null}

        <div className="flex items-center justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={loading || confirmDisabled}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-label-md text-label-md font-bold text-on-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              variant === 'danger'
                ? 'bg-status-rejected hover:bg-tertiary-container'
                : 'bg-primary hover:bg-primary-hover',
            )}
          >
            {loading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
