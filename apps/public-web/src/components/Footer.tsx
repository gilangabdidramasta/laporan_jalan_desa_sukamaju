import { Link } from 'react-router-dom'
import { VILLAGE } from '../lib/village'
import { Logo } from './Brand'

const QUICK_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/berita', label: 'Berita' },
  { to: '/profil', label: 'Profil Kota' },
  { to: '/laporan', label: 'Laporan Kerusakan' },
]

const buildYear = new Date().getFullYear()

export function Footer() {
  const year = buildYear

  return (
    <footer className="w-full bg-surface-dark text-on-primary mt-space-xl">
      <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="md:col-span-7 flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <Logo className="h-11 w-auto" />
              <span className="font-headline-sm text-headline-sm">
                Pemerintah {VILLAGE.nama}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-primary/80">
              {VILLAGE.alamatKantor}
            </p>
            <p className="font-body-sm text-body-sm text-on-primary/80">
              Telepon:{' '}
              <a
                href={`tel:${VILLAGE.teleponHref}`}
                className="font-ticket text-ticket-code font-bold hover:underline"
              >
                {VILLAGE.telepon}
              </a>
            </p>
            <p className="font-body-sm text-body-sm text-on-primary/80">
              Email:{' '}
              <a href={`mailto:${VILLAGE.email}`} className="hover:underline">
                {VILLAGE.email}
              </a>
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col gap-space-xs">
            <span className="font-title text-title mb-space-xs">Tautan Cepat</span>
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-body-sm text-body-sm text-on-primary/80 hover:text-on-primary transition-colors py-space-xs"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-space-md mt-space-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-caption text-caption text-on-primary/70 text-center sm:text-left">
            Copyright © {year} Pemerintah {VILLAGE.nama}. Hak cipta dilindungi.
          </p>
          <p className="font-caption text-caption text-on-primary/50 text-center sm:text-right">
            Sistem Informasi Pelaporan Jalan Kota
          </p>
        </div>
      </div>
    </footer>
  )
}
