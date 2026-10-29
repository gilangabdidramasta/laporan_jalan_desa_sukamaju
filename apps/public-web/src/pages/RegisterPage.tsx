import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

type Fields = 'nama' | 'email' | 'noWa' | 'password' | 'confirm' | 'terms'

export function RegisterPage() {
  usePageTitle('Pendaftaran Akun Warga')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/laporan/saya'

  const [values, setValues] = useState({
    nama: '',
    email: '',
    noWa: '',
    password: '',
    confirm: '',
  })
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={redirect} replace />
  }

  const setValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Partial<Record<Fields, string>> = {}

    if (values.nama.trim().length < 3) {
      next.nama = 'Nama lengkap minimal 3 karakter.'
    }
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      next.email = 'Masukkan alamat email yang valid.'
    }
    const digits = values.noWa.replace(/\D/g, '')
    if (digits.length < 9 || digits.length > 15) {
      next.noWa = 'Nomor WhatsApp tidak valid (9–15 digit).'
    }
    if (values.password.length < 8) {
      next.password = 'Password minimal 8 karakter.'
    }
    if (values.confirm !== values.password) {
      next.confirm = 'Konfirmasi password tidak cocok.'
    }
    if (!terms) {
      next.terms = 'Anda harus menyetujui pernyataan sebelum mendaftar.'
    }

    setErrors(next)
    setServerError(null)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await register({
        nama: values.nama,
        email: values.email,
        noWa: values.noWa,
        password: values.password,
      })
      navigate(redirect, { replace: true })
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Pendaftaran gagal. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field: Fields) =>
    `w-full pl-10 pr-4 py-3 min-h-[48px] rounded-md bg-surface-container-lowest border-2 font-body-md text-body-md text-on-surface transition-all focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-status-rejected focus:ring-status-rejected/40'
        : 'border-border-strong focus:border-primary focus:ring-primary/25'
    }`

  return (
    <AuthShell
      title="Pendaftaran Akun Warga"
      subtitle="Daftarkan diri Anda untuk dapat mengirim dan memantau laporan jalan rusak di Kota Pekanbaru."
      breadcrumb="Daftar Akun Warga"
      footer={
        <>
          Sudah punya akun?{' '}
          <Link
            to={`/masuk${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-primary font-bold hover:underline"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nama" className="font-label-md text-label-md font-bold text-on-surface">
            Nama Lengkap <span className="text-tertiary">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </span>
            <input
              id="nama"
              value={values.nama}
              onChange={(event) => setValue('nama', event.target.value)}
              autoComplete="name"
              placeholder="Contoh: Rizky Ramadhan"
              aria-invalid={Boolean(errors.nama)}
              className={inputClass('nama')}
            />
          </div>
          {errors.nama ? (
            <p className="font-caption text-caption text-status-rejected font-semibold">{errors.nama}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-label-md text-label-md font-bold text-on-surface">
              Email <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={(event) => setValue('email', event.target.value)}
                autoComplete="email"
                placeholder="nama@email.com"
                aria-invalid={Boolean(errors.email)}
                className={inputClass('email')}
              />
            </div>
            {errors.email ? (
              <p className="font-caption text-caption text-status-rejected font-semibold">{errors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="noWa" className="font-label-md text-label-md font-bold text-on-surface">
              Nomor WhatsApp <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </span>
              <input
                id="noWa"
                type="tel"
                inputMode="tel"
                value={values.noWa}
                onChange={(event) => setValue('noWa', event.target.value)}
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                aria-invalid={Boolean(errors.noWa)}
                className={inputClass('noWa')}
              />
            </div>
            {errors.noWa ? (
              <p className="font-caption text-caption text-status-rejected font-semibold">{errors.noWa}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-label-md text-label-md font-bold text-on-surface">
              Password <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={(event) => setValue('password', event.target.value)}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                aria-invalid={Boolean(errors.password)}
                className={inputClass('password')}
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
            {errors.password ? (
              <p className="font-caption text-caption text-status-rejected font-semibold">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="font-label-md text-label-md font-bold text-on-surface">
              Ulangi Password <span className="text-tertiary">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                value={values.confirm}
                onChange={(event) => setValue('confirm', event.target.value)}
                autoComplete="new-password"
                placeholder="Ulangi password"
                aria-invalid={Boolean(errors.confirm)}
                className={inputClass('confirm')}
              />
            </div>
            {errors.confirm ? (
              <p className="font-caption text-caption text-status-rejected font-semibold">
                {errors.confirm}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => {
                setTerms(event.target.checked)
                setErrors((current) => ({ ...current, terms: undefined }))
              }}
              className="mt-0.5 w-4 h-4 rounded border-border-strong text-primary focus:ring-primary"
              aria-invalid={Boolean(errors.terms)}
            />
            <span className="font-caption text-caption text-on-surface-variant leading-relaxed">
              Saya menyatakan data yang saya isikan benar dan bersedia dihubungi
              Admin Kota terkait laporan yang saya kirim. Saya memahami bahwa
              laporan hanya akan tampil publik setelah diverifikasi.
            </span>
          </label>
          {errors.terms ? (
            <p className="font-caption text-caption text-status-rejected font-semibold">{errors.terms}</p>
          ) : null}
        </div>

        {serverError ? (
          <div className="rounded-md bg-status-rejected-soft px-3.5 py-2.5 flex items-start gap-2">
            <span className="material-symbols-outlined text-status-rejected text-[18px] mt-0.5">
              error
            </span>
            <p className="font-caption text-caption text-status-rejected font-semibold">
              {serverError}
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
              Membuat akun…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Daftar Akun Warga
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}
