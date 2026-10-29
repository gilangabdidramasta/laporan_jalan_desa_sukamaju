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

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-space-sm rounded-md py-1"
      aria-label="Beranda Kota Pekanbaru"
    >
      <Logo className="h-12 w-auto" />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-title text-title font-bold ${
            dark ? 'text-on-surface' : 'text-on-primary'
          }`}
        >
          Kota Pekanbaru
        </span>
        <span
          className={`font-caption text-caption ${
            dark ? 'text-on-surface-variant' : 'text-on-primary/80'
          }`}
        >
          Lapor Jalan Kota
        </span>
      </span>
    </Link>
  )
}
