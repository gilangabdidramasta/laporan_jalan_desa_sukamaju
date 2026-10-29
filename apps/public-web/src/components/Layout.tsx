import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Footer } from './Footer'
import { Header } from './Header'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function FloatingAction() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const target = isAuthenticated
    ? '/laporan/baru'
    : '/masuk?redirect=/laporan/baru'

  const hidden =
    pathname === '/laporan/baru' ||
    pathname === '/laporan/saya' ||
    pathname.endsWith('/edit') ||
    pathname === '/masuk' ||
    pathname === '/daftar'

  if (hidden) return null

  return (
    <aside className="fixed bottom-5 right-5 z-40 print:hidden">
      <Link
        to={target}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-title text-title font-semibold shadow-fab transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Buat laporan baru"
      >
        <span className="material-symbols-outlined text-[22px]">add</span>
        <span className="hidden sm:inline">Buat Laporan</span>
      </Link>
    </aside>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <ScrollToTop />
      <Header />
      <main className={`flex-1 w-full ${isHome ? '' : 'pt-16'}`}>
        <Outlet />
      </main>
      <Footer />
      <FloatingAction />
    </div>
  )
}
