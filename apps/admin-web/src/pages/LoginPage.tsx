import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { AuthError } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { Brand } from '../components/Brand'

export function LoginPage() {
  usePageTitle('Masuk')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/laporan" replace />
  }

  const redirectParam = searchParams.get('redirect')
  const redirect =
    redirectParam && redirectParam.startsWith('/') ? redirectParam : '/laporan'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password, remember)
      navigate(redirect, { replace: true })
    } catch (caught) {
      setError(
        caught instanceof AuthError
          ? caught.message
          : 'Terjadi kesalahan. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="relative hidden lg:flex flex-col justify-between bg-surface-dark p-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/img-013.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/70 via-surface-dark/85 to-surface-dark" />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative flex flex-col gap-4 max-w-md">
          <h1 className="font-heading text-[34px] leading-[1.2] font-bold text-on-primary">
            Verifikasi laporan jalan kota, satu antrean setiap hari.
          </h1>
          <p className="font-body-md text-body-md text-primary-fixed/80 leading-relaxed">
            Tinjau laporan warga, publikasikan titik kerusakan yang valid, dan
            kelola konten kota melalui satu dashboard.
          </p>
        </div>
        <p className="relative font-caption text-caption text-white/50">
          Pemerintah Kota Pekanbaru · Sistem Informasi Pelaporan Jalan Kota
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="lg:hidden">
            <Brand variant="light" />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[28px] leading-tight font-bold text-on-surface">
              Masuk ke Dashboard Admin
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Gunakan akun admin yang diberikan oleh Super Admin Kota.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                placeholder="nama@pekanbaru.go.id"
                className="h-11 rounded-md border border-border-strong bg-surface-container-lowest px-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Password
              </span>
              <span className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-11 w-full rounded-md border border-border-strong bg-surface-container-lowest px-3 pr-11 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="w-4 h-4 rounded border-border-strong accent-primary"
              />
              Ingat saya di perangkat ini
            </label>

            {error ? (
              <div
                className="flex items-start gap-2 rounded-md bg-status-rejected-soft px-3 py-2.5 text-status-rejected"
                role="alert"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">
                  error
                </span>
                <p className="font-caption text-caption font-semibold">{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Memeriksa akun…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Masuk
                </>
              )}
            </button>
          </form>

          <div className="flex items-start gap-2 rounded-md bg-surface-container-low px-3 py-2.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
              help
            </span>
            <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
              Lupa password? Hubungi Super Admin untuk reset password. Akun admin
              tidak dapat didaftarkan sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
