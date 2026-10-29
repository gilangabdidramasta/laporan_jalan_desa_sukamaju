import { Link } from 'react-router-dom'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <img src="/images/logo.png" alt="" className="h-full w-auto object-contain" />
    </span>
  )
}

export function Brand({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const dark = variant === 'dark'
  return (
    <Link
      to="/laporan"
      className="flex items-center gap-space-sm rounded-md py-1"
      aria-label="Dashboard Admin Kota Pekanbaru"
    >
      <Logo className="h-12 w-auto" />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-title text-title font-bold ${
            dark ? 'text-on-primary' : 'text-on-surface'
          }`}
        >
          Kota Pekanbaru
        </span>
        <span
          className={`font-caption text-caption ${
            dark ? 'text-primary-fixed/80' : 'text-on-surface-variant'
          }`}
        >
          Dashboard Admin
        </span>
      </span>
    </Link>
  )
}
