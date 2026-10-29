import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLE: Record<ToastVariant, { icon: string; className: string }> =
  {
    success: {
      icon: 'check_circle',
      className: 'border-status-approved/30 bg-status-approved-soft text-status-approved',
    },
    error: {
      icon: 'error',
      className: 'border-status-rejected/30 bg-status-rejected-soft text-status-rejected',
    },
    info: {
      icon: 'info',
      className: 'border-secondary/30 bg-secondary-soft text-secondary',
    },
  }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current, { id, message, variant }])
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, 3800)
    },
    [],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[1200] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLE[toast.variant]
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-card-hover animate-fade-up ${style.className}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                {style.icon}
              </span>
              <p className="font-body-sm text-body-sm font-semibold leading-snug">
                {toast.message}
              </p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider')
  return context
}
