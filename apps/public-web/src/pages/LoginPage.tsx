import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

export function LoginPage() {
  usePageTitle('Masuk Akun Warga')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/laporan/saya'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  if (isAuthenticated) {
    return <Navigate to={redirect} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: { email?: string; password?: string } = {}
    if (!email.trim()) next.email = 'Email wajib diisi.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Format email tidak valid.'
    if (!password) next.password = 'Password wajib diisi.'
    setFieldErrors(next)
    setError(null)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Masuk Akun Warga"
      subtitle="Gunakan email dan password akun warga Anda untuk mengirim serta memantau laporan jalan rusak."
      breadcrumb="Masuk Akun Warga"
      footer={
        <>
          Belum punya akun?{' '}
          <Link
            to={`/daftar${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-primary font-bold hover:underline"
          >
            Daftar Akun Warga
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-label-md text-label-md font-bold text-on-surface">
            Alamat Email <span className="text-tertiary">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setFieldErrors((current) => ({ ...current, email: undefined }))
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              placeholder="nama@email.com"
              className={`w-full pl-10 pr-4 py-3 min-h-[48px] rounded-md bg-surface-container-lowest border-2 font-body-md text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? 'border-status-rejected focus:ring-status-rejected/40'
                  : 'border-border-strong focus:border-primary focus:ring-primary/25'
              }`}
            />
          </div>
          {fieldErrors.email ? (
            <p id="email-error" className="font-caption text-caption text-status-rejected font-semibold">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="password"
              className="font-label-md text-label-md font-bold text-on-surface"
            >
              Password <span className="text-tertiary">*</span>
            </label>
            <span className="font-caption text-caption text-on-surface-variant">
              Lupa password? Hubungi Admin Kota
            </span>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setFieldErrors((current) => ({ ...current, password: undefined }))
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              placeholder="Masukkan password"
              className={`w-full pl-10 pr-12 py-3 min-h-[48px] rounded-md bg-surface-container-lowest border-2 font-body-md text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? 'border-status-rejected focus:ring-status-rejected/40'
                  : 'border-border-strong focus:border-primary focus:ring-primary/25'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {fieldErrors.password ? (
            <p
              id="password-error"
              className="font-caption text-caption text-status-rejected font-semibold"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md bg-status-rejected-soft px-3.5 py-2.5 flex items-start gap-2">
            <span className="material-symbols-outlined text-status-rejected text-[18px] mt-0.5">
              error
            </span>
            <p className="font-caption text-caption text-status-rejected font-semibold">
              {error}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-md bg-primary-container hover:bg-primary-hover text-on-primary font-title text-title font-bold shadow-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">
                progress_activity
              </span>
              Memeriksa akun…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">login</span>
              Masuk
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}
