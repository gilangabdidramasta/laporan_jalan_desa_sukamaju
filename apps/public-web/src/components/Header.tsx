import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Brand } from './Brand'

const NAV_ITEMS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/berita', label: 'Berita' },
  { to: '/profil', label: 'Profil Kota' },
  { to: '/laporan', label: 'Laporan' },
]

export function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [overHero, setOverHero] = useState(isHome)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isHome) return
    let frame = 0
    const measure = () => {
      frame = 0
      const hero = document.querySelector('[data-hero]')
      const bottom = hero ? hero.getBoundingClientRect().bottom : 0
      setOverHero(bottom > 64)
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [isHome])

  const transparent = isHome && overHero

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-shadow duration-300 ${
        scrolled && !transparent ? 'shadow-bar' : ''
      }`}
    >
      <div
        className={`transition-colors duration-300 ${
          transparent
            ? 'bg-gradient-to-b from-black/45 via-black/20 to-transparent'
            : 'bg-primary/95 backdrop-blur-md'
        }`}
      >
        <div className="h-16 max-w-7xl mx-auto px-margin lg:px-margin-desktop flex items-center justify-between gap-space-md">
          <Brand />

          <nav className="hidden md:flex items-center gap-space-lg" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `pb-1 transition-colors ${
                    isActive
                      ? 'text-on-primary font-bold border-b-2 border-on-primary'
                      : 'text-on-primary/90 hover:text-on-primary border-b-2 border-transparent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-space-sm">
            {user ? (
              <>
                <Link
                  to="/laporan/saya"
                  className="hidden lg:inline-flex items-center gap-2 min-h-[38px] px-space-md rounded-md text-on-primary bg-white/10 hover:bg-white/20 transition-colors"
                  data-testid="nav-laporan-saya"
                >
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  <span className="font-label-md text-label-md">Laporan Saya</span>
                </Link>
                <div className="flex items-center gap-space-xs rounded-full bg-white/10 pl-1 pr-3 py-1">
                  <span className="w-7 h-7 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center font-label-md text-label-md font-bold">
                    {user.nama.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-label-md text-label-md text-on-primary max-w-[10ch] truncate">
                    {user.nama.split(' ')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 min-h-[38px] px-space-md rounded-md text-on-primary bg-white/10 hover:bg-white/20 transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/masuk"
                  className="inline-flex items-center justify-center min-h-[38px] px-space-md rounded-md font-label-md text-label-md text-on-primary bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/daftar"
                  className="inline-flex items-center justify-center min-h-[38px] px-space-md rounded-md font-label-md text-label-md font-bold bg-surface-container-lowest text-primary hover:bg-primary-soft transition-colors shadow-card"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-space-xs">
            {user ? (
              <Link
                to="/laporan/saya"
                className="w-9 h-9 rounded-full bg-white/15 text-on-primary flex items-center justify-center"
                aria-label="Laporan Saya"
              >
                <span className="material-symbols-outlined text-[20px]">folder_open</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="w-11 h-11 rounded-md text-on-primary flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
            >
              <span className="material-symbols-outlined text-[26px]">
                {open ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          id="menu-mobile"
          onClick={() => setOpen(false)}
          className="md:hidden bg-surface-container-lowest shadow-card-hover border-b border-border-subtle animate-fade-up"
        >
          <nav className="px-margin py-space-md flex flex-col" aria-label="Navigasi seluler">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between min-h-[48px] px-space-sm rounded-md ${
                    isActive
                      ? 'bg-primary-soft text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                {item.label}
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  chevron_right
                </span>
              </NavLink>
            ))}

            <div className="mt-space-md pt-space-md border-t border-border-subtle flex flex-col gap-space-sm">
              {user ? (
                <>
                  <div className="flex items-center gap-space-sm px-space-sm py-space-xs">
                    <span className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-label-md font-bold">
                      {user.nama.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">
                        {user.nama}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/laporan/saya"
                    className="flex items-center gap-2 min-h-[44px] px-space-sm rounded-md bg-surface-container-low text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">folder_open</span>
                    <span className="font-label-md text-label-md">Laporan Saya</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 min-h-[44px] px-space-sm rounded-md text-status-rejected"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="font-label-md text-label-md">Keluar</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/masuk"
                    className="flex items-center justify-center min-h-[44px] rounded-md border border-primary text-primary font-label-md text-label-md"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/daftar"
                    className="flex items-center justify-center min-h-[44px] rounded-md bg-primary text-on-primary font-label-md text-label-md font-bold"
                  >
                    Daftar Akun Warga
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
