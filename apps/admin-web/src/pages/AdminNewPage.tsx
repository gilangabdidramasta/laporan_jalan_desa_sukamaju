import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { createAdmin } from '../lib/store'
import type { AdminRole } from '../lib/types'
import { cn } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

const ROLE_OPTIONS: Array<{
  value: AdminRole
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description:
      'Dapat memverifikasi laporan, mengelola berita, dan mengelola akun warga.',
    icon: 'badge',
  },
  {
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    description:
      'Akses baca saja ke laporan, berita, dan akun warga. Dapat mengelola akun admin.',
    icon: 'shield_person',
  },
]

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let value = ''
  for (let index = 0; index < 10; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)]
  }
  return value
}

export function AdminNewPage() {
  usePageTitle('Tambah Admin')
  const { showToast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<AdminRole>('ADMIN')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createAdmin({ nama, email, password, role }),
    onSuccess: (admin) => {
      void queryClient.invalidateQueries({ queryKey: ['admins'] })
      showToast(`Akun ${admin.nama} berhasil dibuat.`)
      navigate('/akun-admin')
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : 'Gagal membuat akun.')
    },
  })

  const passwordTooShort = password.length > 0 && password.length < 8
  const mismatch = confirm.length > 0 && confirm !== password
  const canSubmit =
    nama.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    password.length >= 8 &&
    confirm === password &&
    !mutation.isPending

  return (
    <>
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <Link to="/akun-admin" className="hover:text-primary inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            Akun Admin
          </Link>
          <span>/</span>
          <span>Tambah Admin</span>
        </nav>
        <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
          Tambah Akun Admin
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Akun admin tidak dapat mendaftar sendiri. Super Admin membuat akun dan
          menyerahkan password awal secara langsung.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          if (canSubmit) mutation.mutate()
        }}
        className="grid lg:grid-cols-3 gap-4 items-start"
      >
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-container-lowest p-4 sm:p-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Nama lengkap <span className="text-tertiary">*</span>
            </span>
            <input
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              maxLength={80}
              placeholder="Nama sesuai tugas di Pemerintah Kota"
              className="h-11 rounded-md border border-border-strong bg-surface-container-lowest px-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Email <span className="text-tertiary">*</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@pekanbaru.go.id"
              autoComplete="off"
              className="h-11 rounded-md border border-border-strong bg-surface-container-lowest px-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <span className="font-caption text-caption text-on-surface-variant">
              Gunakan email resmi Pemerintah Kota bila tersedia.
            </span>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Password awal <span className="text-tertiary">*</span>
              </span>
              <span className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className={cn(
                    'h-11 w-full rounded-md border bg-surface-container-lowest px-3 pr-11 font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/15',
                    passwordTooShort
                      ? 'border-status-rejected focus:border-status-rejected'
                      : 'border-border-strong focus:border-primary',
                  )}
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
              <button
                type="button"
                onClick={() => {
                  const next = generatePassword()
                  setPassword(next)
                  setConfirm(next)
                  setShowPassword(true)
                }}
                className="self-start font-caption text-caption font-bold text-secondary hover:underline"
              >
                Buatkan password acak
              </button>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Konfirmasi password <span className="text-tertiary">*</span>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                className={cn(
                  'h-11 rounded-md border bg-surface-container-lowest px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/15',
                  mismatch
                    ? 'border-status-rejected focus:border-status-rejected'
                    : 'border-border-strong focus:border-primary',
                )}
              />
              <span
                className={cn(
                  'font-caption text-caption',
                  passwordTooShort || mismatch
                    ? 'text-status-rejected font-semibold'
                    : 'text-on-surface-variant',
                )}
              >
                {passwordTooShort
                  ? 'Password minimal 8 karakter.'
                  : mismatch
                    ? 'Konfirmasi password tidak sama.'
                    : 'Minimal 8 karakter.'}
              </span>
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-label-md text-label-md font-bold text-on-surface mb-1">
              Peran <span className="text-tertiary">*</span>
            </legend>
            {ROLE_OPTIONS.map((option) => {
              const active = role === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    active
                      ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/20'
                      : 'border-border-strong bg-surface-container-lowest hover:border-primary/40',
                  )}
                >
                  <span
                    className={cn(
                      'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
                      active
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-body-sm text-body-sm font-bold text-on-surface">
                      {option.label}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant leading-relaxed">
                      {option.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </fieldset>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Ringkasan akses
            </h2>
            <ul className="flex flex-col gap-2">
              {(role === 'ADMIN'
                ? [
                    'Verifikasi laporan warga',
                    'Kelola berita kota',
                    'Kelola akun warga',
                  ]
                : [
                    'Lihat laporan (baca saja)',
                    'Lihat berita (baca saja)',
                    'Lihat akun warga (baca saja)',
                    'Kelola akun admin',
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-2">
            {error ? (
              <div className="flex items-start gap-2 rounded-md bg-status-rejected-soft px-3 py-2.5" role="alert">
                <span className="material-symbols-outlined text-[18px] text-status-rejected shrink-0">
                  error
                </span>
                <p className="font-caption text-caption font-semibold text-status-rejected">
                  {error}
                </p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-10 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {mutation.isPending ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              )}
              Buat Akun Admin
            </button>
            <button
              type="button"
              onClick={() => navigate('/akun-admin')}
              className="h-10 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container"
            >
              Batal
            </button>
          </section>
        </div>
      </form>
    </>
  )
}
