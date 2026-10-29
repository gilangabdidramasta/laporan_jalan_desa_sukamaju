import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchPendingCount } from '../lib/store'
import { cn } from '../lib/format'
import { Brand, Logo } from './Brand'
import { RoleBadge } from './StatusBadge'

interface NavItem {
  to: string
  label: string
  icon: string
  superOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/laporan', label: 'Laporan', icon: 'description' },
  { to: '/berita', label: 'Berita', icon: 'newspaper' },
  { to: '/akun-warga', label: 'Akun Warga', icon: 'group' },
  { to: '/akun-admin', label: 'Akun Admin', icon: 'shield_person', superOnly: true },
]

const buildYear = new Date().getFullYear()

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isSuperAdmin } = useAuth()
  const { data: pending } = useQuery({
    queryKey: ['pending-count'],
    queryFn: fetchPendingCount,
    refetchInterval: 60_000,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center border-b border-white/10 shrink-0">
        <Brand />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1" aria-label="Navigasi utama">
        <p className="px-3 pb-2 font-caption text-[11px] uppercase tracking-widest text-primary-fixed/50 font-bold">
          Operasional
        </p>
        {NAV_ITEMS.filter((item) => !item.superOnly || isSuperAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md font-label-md text-label-md transition-colors',
                isActive
                  ? 'bg-white/12 text-on-primary font-bold shadow-[inset_3px_0_0_var(--color-primary-fixed)]'
                  : 'text-primary-fixed/80 hover:bg-white/8 hover:text-on-primary',
              )
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.to === '/laporan' && pending ? (
              <span className="min-w-6 h-5 px-1.5 rounded-full bg-status-pending text-white font-caption text-[11px] font-bold flex items-center justify-center">
                {pending}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function AdminLayout() {
  const { admin, isSuperAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const adminInitial = admin?.nama?.trim().charAt(0).toUpperCase() || 'A'

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-surface">
      <ScrollToTop />

      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-surface-dark z-40">
        <SidebarContent />
      </aside>

      {menuOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/50"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-surface-dark shadow-card-hover animate-fade-up">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest border-b border-border-subtle flex items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-md flex items-center justify-center text-on-surface hover:bg-surface-container"
              aria-label="Buka menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span className="lg:hidden">
              <Link to="/laporan" aria-label="Dashboard Admin Kota Pekanbaru">
                <Logo className="h-10 w-auto" />
              </Link>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              Panel verifikasi laporan jalan kota
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-label-md text-label-md font-bold text-primary-hover"
                aria-hidden="true"
              >
                {adminInitial}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="max-w-[130px] truncate font-label-md text-label-md font-bold text-on-surface"
                  title={admin?.nama}
                >
                  {admin?.nama}
                </span>
                <RoleBadge role={admin?.role ?? 'ADMIN'} />
              </div>
            </div>
            <div className="sm:hidden">
              <RoleBadge role={admin?.role ?? 'ADMIN'} />
            </div>
            <span className="hidden sm:block h-6 w-px bg-border-subtle" aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle font-label-md text-label-md font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Keluar</span>
              <span className="sr-only sm:hidden">Keluar</span>
            </button>
          </div>
        </header>

        {isSuperAdmin ? (
          <div className="sticky top-16 z-20 bg-status-pending-soft border-b border-status-pending/20 px-4 sm:px-6 py-2">
            <p className="max-w-[1400px] mx-auto flex items-start gap-2 font-body-sm text-body-sm text-status-pending">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                visibility
              </span>
              <span>
                <strong>Mode baca saja.</strong> Akun Super Admin hanya dapat
                melihat data. Untuk mengubah laporan, berita, atau akun warga,
                gunakan akun Admin.
              </span>
            </p>
          </div>
        ) : null}

        <main className="flex-1 px-4 sm:px-6 py-6">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-5">
            <Outlet />
          </div>
        </main>

        <footer className="px-4 sm:px-6 py-4 border-t border-border-subtle">
          <p className="max-w-[1400px] mx-auto font-caption text-caption text-on-surface-variant">
            Pemerintah Kota Pekanbaru · Sistem Informasi Pelaporan Jalan Kota ·{' '}
            {buildYear}
          </p>
        </footer>
      </div>
    </div>
  )
}
