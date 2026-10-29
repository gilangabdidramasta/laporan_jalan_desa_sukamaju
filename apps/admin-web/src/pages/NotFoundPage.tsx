import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Halaman Tidak Ditemukan')

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16 px-6">
      <div className="flex flex-col items-center text-center gap-2 max-w-md mx-auto">
        <span className="material-symbols-outlined text-[52px] text-outline-variant">
          explore_off
        </span>
        <p className="font-caption text-caption font-bold uppercase tracking-widest text-on-surface-variant">
          Galat 404
        </p>
        <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
          Halaman tidak ditemukan
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Alamat yang Anda buka tidak tersedia di dashboard admin. Periksa kembali
          tautan atau kembali ke halaman laporan.
        </p>
        <Link
          to="/laporan"
          className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Laporan
        </Link>
      </div>
    </div>
  )
}
