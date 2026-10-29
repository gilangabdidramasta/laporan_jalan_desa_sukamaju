import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { VILLAGE } from '../lib/village'

const HIGHLIGHTS = [
  {
    icon: 'add_location_alt',
    color: 'bg-primary text-on-primary',
    title: 'Laporkan Kerusakan Seketika',
    text: 'Unggah foto kerusakan asli, cantumkan titik RT/RW serta koordinat presisi peta kota.',
  },
  {
    icon: 'track_changes',
    color: 'bg-secondary text-on-secondary',
    title: 'Pelacakan Tiket Terbuka',
    text: 'Pantau status validasi oleh Admin Kota melalui kode tiket laporan Anda.',
  },
  {
    icon: 'security',
    color: 'bg-status-approved text-on-primary',
    title: 'Integritas Data Warga',
    text: 'Identitas pelapor terhubung ke akun, mengurangi spam dan menjaga akurasi data.',
  },
]

export function AuthShell({
  title,
  subtitle,
  breadcrumb,
  children,
  footer,
}: {
  title: string
  subtitle: string
  breadcrumb: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop flex flex-col">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-caption text-caption text-primary-fixed-dim mb-1"
          >
            <Link to="/" className="hover:text-on-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">home</span>
              Beranda
            </Link>
            <span className="text-primary-fixed-dim/50">/</span>
            <span className="text-on-primary font-medium">{breadcrumb}</span>
          </nav>
          <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tight">
            {title}
          </h1>
          <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      <div className="w-full -mt-10 pb-space-xl">
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-5 flex flex-col gap-space-md order-2 lg:order-1">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-card">
                <div className="flex items-center gap-space-sm mb-space-md">
                  <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">
                      account_balance
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
                      Pemerintah Kota
                    </span>
                    <span className="font-title text-title text-on-surface">
                      Transparansi Publik
                    </span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed">
                  Selamat datang di sistem autentikasi warga {VILLAGE.nama}.
                  Melalui akun warga, setiap laporan kerusakan jalan Anda terekam
                  secara sistematis dan mendapatkan nomor tiket pemantauan yang
                  sah.
                </p>
                <div className="flex flex-col gap-space-sm pt-space-xs">
                  {HIGHLIGHTS.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-low"
                    >
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-body-sm text-body-sm font-bold text-on-surface">
                          {item.title}
                        </h4>
                        <p className="font-caption text-caption text-on-surface-variant leading-snug">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-space-lg">
                <div className="flex items-start gap-space-sm mb-space-sm">
                  <div className="w-10 h-10 rounded-md bg-secondary-soft text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">
                      lock_reset
                    </span>
                  </div>
                  <div>
                    <h3 className="font-title text-title text-on-surface font-bold">
                      Lupa Password?
                    </h3>
                    <p className="font-caption text-caption text-on-surface-variant leading-snug mt-0.5">
                      Perubahan atau reset password warga hanya dapat dilakukan
                      oleh Admin Kota. Silakan hubungi kantor Pemerintah Kota
                      dengan membawa identitas.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-caption text-caption text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">call</span>
                    {VILLAGE.telepon}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-card">
                {children}
                <div className="mt-space-lg pt-space-md border-t border-border-subtle text-center font-body-sm text-body-sm text-on-surface-variant">
                  {footer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
