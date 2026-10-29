import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Halaman Tidak Ditemukan')

  return (
    <div className="w-full bg-background py-16">
      <div className="max-w-2xl mx-auto px-margin flex flex-col items-center text-center gap-space-md">
        <div className="w-24 h-24 rounded-full bg-primary-soft text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px]">explore_off</span>
        </div>
        <span className="font-ticket text-[64px] leading-none font-bold text-secondary/30 tabular-nums">
          404
        </span>
        <h1 className="font-heading text-[26px] sm:text-[32px] text-on-surface font-bold leading-tight">
          Halaman Tidak Ditemukan
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-md">
          Tautan yang Anda buka mungkin salah ketik atau sudah dipindahkan. Silakan
          kembali ke beranda atau telusuri laporan jalan rusak kota.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-space-sm w-full sm:w-auto">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-md bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Kembali ke Beranda
          </Link>
          <Link
            to="/laporan"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-md border border-border-strong text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            Lihat Peta Laporan
          </Link>
        </div>
      </div>
    </div>
  )
}
