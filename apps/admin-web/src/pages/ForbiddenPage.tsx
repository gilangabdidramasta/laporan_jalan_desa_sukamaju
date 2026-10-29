import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export function ForbiddenPage() {
  usePageTitle('Akses Ditolak')
  const { isSuperAdmin } = useAuth()

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16 px-6">
      <div className="flex flex-col items-center text-center gap-2 max-w-md mx-auto">
        <span className="w-14 h-14 rounded-full bg-status-rejected-soft text-status-rejected flex items-center justify-center">
          <span className="material-symbols-outlined text-[30px]">lock</span>
        </span>
        <p className="font-caption text-caption font-bold uppercase tracking-widest text-status-rejected mt-1">
          Galat 403
        </p>
        <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
          Anda tidak memiliki akses
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Halaman ini hanya dapat dibuka oleh peran tertentu. Akun Anda saat ini
          tercatat sebagai {isSuperAdmin ? 'Super Admin' : 'Admin'}.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Link
            to="/laporan"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Laporan
          </Link>
        </div>
      </div>
    </div>
  )
}
