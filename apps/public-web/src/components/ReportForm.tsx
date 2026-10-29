import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { cn, formatDateTime, formatDate } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'
import { DAMAGE_TYPES, type DamageType, type ReportDraft } from '../lib/types'
import { MapPicker } from './MapPicker'
import { PhotoUploader } from './PhotoUploader'

const STEPS = [
  { key: 'foto', label: 'Foto', hint: 'Bukti visual' },
  { key: 'lokasi', label: 'Lokasi Jalan', hint: 'Pin & alamat' },
  { key: 'detail', label: 'Detail', hint: 'Jenis & uraian' },
  { key: 'ringkasan', label: 'Ringkasan', hint: 'Periksa & kirim' },
]

const EMPTY_DRAFT: ReportDraft = {
  photos: [],
  alamat: '',
  latitude: null,
  longitude: null,
  damageTypes: [],
  deskripsi: '',
}

function readStoredDraft(key: string): ReportDraft | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReportDraft
    return { ...EMPTY_DRAFT, ...parsed }
  } catch {
    return null
  }
}

export function ReportForm({
  mode,
  initial,
  onSubmit,
  submitting,
  submitError,
}: {
  mode: 'create' | 'edit'
  initial?: ReportDraft
  onSubmit: (draft: ReportDraft) => Promise<void>
  submitting: boolean
  submitError?: string | null
}) {
  usePageTitle(mode === 'create' ? 'Buat Laporan' : 'Ubah Laporan')
  const { user } = useAuth()
  const storageKey = `lapor.draft.${mode}`

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ReportDraft>(
    () => initial ?? readStoredDraft(storageKey) ?? EMPTY_DRAFT,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (initial && mode === 'edit') {
      setDraft(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(draft))
        setSavedAt(new Date())
      } catch {
        /* kuota penuh — abaikan */
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [draft, storageKey])

  const update = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  const toggleDamage = (type: DamageType) => {
    setDraft((current) => {
      const exists = current.damageTypes.includes(type)
      return {
        ...current,
        damageTypes: exists
          ? current.damageTypes.filter((item) => item !== type)
          : [...current.damageTypes, type],
      }
    })
    setErrors((current) => ({ ...current, damageTypes: '' }))
  }

  const validateStep = (index: number): boolean => {
    const next: Record<string, string> = {}

    if (index === 0 && draft.photos.length === 0) {
      next.photos = 'Unggah minimal satu foto kerusakan.'
    }

    if (index === 1) {
      if (draft.latitude === null || draft.longitude === null) {
        next.location = 'Tandai titik lokasi kerusakan pada peta.'
      }
      if (draft.alamat.trim().length < 10) {
        next.alamat =
          'Alamat minimal 10 karakter. Tambahkan RT/RW, kelurahan, atau patokan sekitar.'
      }
    }

    if (index === 2) {
      if (draft.damageTypes.length === 0) {
        next.damageTypes = 'Pilih minimal satu jenis kerusakan.'
      }
      if (draft.deskripsi.trim().length < 20) {
        next.deskripsi =
          'Jelaskan kondisi kerusakan minimal 20 karakter agar mudah diverifikasi.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const useMyLocation = () => {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Peramban Anda tidak mendukung deteksi lokasi.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))
        setErrors((current) => ({ ...current, location: '' }))
        setLocating(false)
      },
      () => {
        setGeoError(
          'Lokasi tidak dapat dibaca. Tandai titik secara manual pada peta.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const photoHint = useMemo(
    () =>
      draft.photos.length > 0
        ? `${draft.photos.length} foto siap`
        : 'Belum ada foto',
    [draft.photos.length],
  )

  return (
    <div className="w-full bg-background py-10 lg:py-14">
      <div className="max-w-[1200px] mx-auto px-margin lg:px-margin-desktop flex flex-col items-center">
        <article className="w-full max-w-[840px] bg-surface-container-lowest rounded-2xl shadow-card p-5 sm:p-8 lg:p-10">
          <header className="flex flex-col gap-3 pb-6 border-b border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-heading text-[26px] sm:text-[32px] leading-tight text-on-surface font-bold">
                {mode === 'create'
                  ? 'Buat Laporan Jalan Rusak'
                  : 'Ubah Laporan Jalan Rusak'}
              </h1>
              <div className="flex items-center gap-2">
                {savedAt ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary-hover font-caption text-caption font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-status-approved">
                      check_circle
                    </span>
                    Draf tersimpan
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-caption text-caption">
                  <span className="material-symbols-outlined text-[15px]">event_note</span>
                  {mode === 'create' ? 'Kuota harian: maks 10' : 'Status: menunggu verifikasi'}
                </span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {mode === 'create'
                ? 'Lengkapi bukti foto, titik koordinat, dan alamat kerusakan jalan di wilayah Kota Pekanbaru agar dapat diverifikasi oleh Admin Kota.'
                : 'Perbarui data laporan Anda. Perubahan hanya dapat dilakukan selama status masih menunggu verifikasi Admin Kota.'}
            </p>
          </header>

          <nav aria-label="Progress alur pelaporan" className="pt-8 pb-10">
            <div className="flex items-start justify-between relative">
              <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-surface-container-highest z-0" />
              <div
                className="absolute left-6 top-5 -translate-y-1/2 h-1 bg-primary-container z-0 transition-all duration-300"
                style={{
                  width: `${(step / (STEPS.length - 1)) * 88}%`,
                  maxWidth: 'calc(100% - 3rem)',
                }}
              />
              {STEPS.map((item, index) => {
                const done = index < step
                const active = index === step
                return (
                  <div key={item.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-headline-sm text-headline-sm transition-colors',
                        done && 'bg-primary-container text-on-primary shadow-card',
                        active &&
                          'bg-primary-container text-on-primary ring-4 ring-primary-soft shadow-card',
                        !done && !active &&
                          'bg-surface-container-highest text-on-surface-variant',
                      )}
                      aria-current={active ? 'step' : undefined}
                    >
                      {done ? (
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2.5 font-label-md text-label-md text-center',
                        active
                          ? 'text-on-surface font-bold'
                          : done
                            ? 'text-primary font-bold'
                            : 'text-on-surface-variant font-medium',
                      )}
                    >
                      {index + 1}. {item.label}
                    </span>
                    <span
                      className={cn(
                        'font-caption text-caption text-center hidden sm:block',
                        active
                          ? 'text-primary font-bold'
                          : done
                            ? 'text-status-approved'
                            : 'text-outline',
                      )}
                    >
                      {index === 0 && draft.photos.length > 0 && (done || active)
                        ? `${draft.photos.length} foto`
                        : active
                          ? 'Sedang diisi'
                          : item.hint}
                    </span>
                  </div>
                )
              })}
            </div>
          </nav>

          <section className="flex flex-col gap-space-lg">
            {/* --------------------------- STEP 1: FOTO -------------------------- */}
            {step === 0 ? (
              <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      add_a_photo
                    </span>
                    Foto Bukti Kerusakan
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Ambil foto dari beberapa sudut agar kondisi jalan terlihat
                    jelas. Sertakan patokan sekitar bila memungkinkan.
                  </p>
                </div>

                <PhotoUploader
                  photos={draft.photos}
                  onChange={(photos) => update('photos', photos)}
                />
                {errors.photos ? (
                  <div className="flex items-start gap-1.5 text-status-rejected">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                      warning
                    </span>
                    <p className="font-caption text-caption font-semibold">
                      {errors.photos}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-lg bg-surface-container-low p-space-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    lightbulb
                  </span>
                  <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    <p className="text-on-surface font-semibold">Tips foto yang baik</p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>Ambil dari jarak dekat dan jauh.</li>
                      <li>Pastikan cahaya cukup, hindari foto buram.</li>
                      <li>Jangan menyertakan wajah orang tanpa izin.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {/* -------------------------- STEP 2: LOKASI ------------------------- */}
            {step === 1 ? (
              <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      pin_drop
                    </span>
                    Titik Lokasi Jalan
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Geser peta dan ketuk tepat pada badan jalan yang rusak. Anda
                    juga dapat menggeser pin untuk koreksi.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      Peta Lokasi <span className="text-tertiary">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface font-caption text-caption font-semibold transition-colors disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {locating ? 'progress_activity' : 'my_location'}
                      </span>
                      {locating ? 'Membaca lokasi…' : 'Gunakan lokasi saya'}
                    </button>
                  </div>

                  <MapPicker
                    value={{ lat: draft.latitude, lng: draft.longitude }}
                    onChange={(lat, lng) => {
                      setDraft((current) => ({
                        ...current,
                        latitude: lat,
                        longitude: lng,
                      }))
                      setErrors((current) => ({ ...current, location: '' }))
                    }}
                  />

                  {geoError ? (
                    <p className="font-caption text-caption text-status-pending font-semibold">
                      {geoError}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-surface-container-low px-3 py-2">
                      <span className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">
                        Lintang
                      </span>
                      <p className="font-ticket text-ticket-code text-on-surface tabular-nums">
                        {draft.latitude !== null ? draft.latitude.toFixed(6) : '—'}
                      </p>
                    </div>
                    <div className="rounded-md bg-surface-container-low px-3 py-2">
                      <span className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">
                        Bujur
                      </span>
                      <p className="font-ticket text-ticket-code text-on-surface tabular-nums">
                        {draft.longitude !== null ? draft.longitude.toFixed(6) : '—'}
                      </p>
                    </div>
                  </div>

                  {errors.location ? (
                    <div className="flex items-start gap-1.5 text-status-rejected">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                        warning
                      </span>
                      <p className="font-caption text-caption font-semibold">
                        {errors.location}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg bg-surface-container-low p-space-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-pending text-[22px]">
                    info
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface">Catatan akurasi:</strong>{' '}
                    Bantuan GPS ponsel hanya perkiraan awal. Pastikan pin berada
                    tepat di atas badan jalan yang rusak, bukan di pekarangan warga.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="alamat"
                      className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-1"
                    >
                      Alamat Lengkap &amp; Patokan Jalan{' '}
                      <span className="text-tertiary">*</span>
                    </label>
                    <span
                      className={cn(
                        'font-ticket text-caption font-bold tabular-nums',
                        draft.alamat.length > 500
                          ? 'text-status-rejected'
                          : 'text-on-surface-variant',
                      )}
                    >
                      {draft.alamat.length} / 500
                    </span>
                  </div>
                  <textarea
                    id="alamat"
                    value={draft.alamat}
                    onChange={(event) => update('alamat', event.target.value.slice(0, 500))}
                    rows={4}
                    aria-invalid={Boolean(errors.alamat)}
                    aria-describedby={errors.alamat ? 'alamat-error' : undefined}
                    placeholder="Contoh: Jl. Jend. Sudirman RT 02/RW 01, Kelurahan Sukaramai, dekat simpang."
                    className={cn(
                      'w-full rounded-lg p-3.5 font-body-md text-body-md text-on-surface bg-surface-container-lowest border-2 transition-all resize-y min-h-[110px] focus:outline-none focus:ring-2',
                      errors.alamat
                        ? 'border-status-rejected focus:ring-status-rejected'
                        : 'border-border-strong focus:border-primary focus:ring-primary/30',
                    )}
                  />
                  {errors.alamat ? (
                    <div
                      id="alamat-error"
                      className="flex items-start gap-1.5 text-status-rejected"
                    >
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                        warning
                      </span>
                      <p className="font-caption text-caption font-semibold">
                        {errors.alamat}
                      </p>
                    </div>
                  ) : (
                    <p className="font-caption text-caption text-on-surface-variant">
                      Sertakan RT/RW, nama kelurahan, atau patokan agar petugas
                      mudah menemukan lokasi.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* -------------------------- STEP 3: DETAIL ------------------------- */}
            {step === 2 ? (
              <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      hardware
                    </span>
                    Detail Kerusakan
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Pilih jenis kerusakan yang terlihat. Anda dapat memilih lebih
                    dari satu jenis.
                  </p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="font-label-md text-label-md font-bold text-on-surface mb-1">
                    Jenis Kerusakan <span className="text-tertiary">*</span>
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DAMAGE_TYPES.map((type) => {
                      const active = draft.damageTypes.includes(type.value)
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => toggleDamage(type.value)}
                          aria-pressed={active}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                            active
                              ? 'border-primary bg-primary-soft/60'
                              : 'border-border-subtle bg-surface-container-lowest hover:border-border-strong hover:bg-surface-container-low',
                          )}
                        >
                          <span
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                              active
                                ? 'bg-primary border-primary text-on-primary'
                                : 'border-border-strong',
                            )}
                          >
                            {active ? (
                              <span className="material-symbols-outlined text-[15px]">check</span>
                            ) : null}
                          </span>
                          <span className="flex flex-col">
                            <span className="font-label-md text-label-md font-bold text-on-surface">
                              {type.label}
                            </span>
                            <span className="font-caption text-caption text-on-surface-variant leading-snug">
                              {type.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.damageTypes ? (
                    <div className="flex items-start gap-1.5 text-status-rejected">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                        warning
                      </span>
                      <p className="font-caption text-caption font-semibold">
                        {errors.damageTypes}
                      </p>
                    </div>
                  ) : null}
                </fieldset>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="deskripsi"
                      className="font-label-md text-label-md font-bold text-on-surface"
                    >
                      Deskripsi Kerusakan <span className="text-tertiary">*</span>
                    </label>
                    <span className="font-ticket text-caption font-bold text-on-surface-variant tabular-nums">
                      {draft.deskripsi.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="deskripsi"
                    value={draft.deskripsi}
                    onChange={(event) =>
                      update('deskripsi', event.target.value.slice(0, 1000))
                    }
                    rows={6}
                    aria-invalid={Boolean(errors.deskripsi)}
                    placeholder="Jelaskan ukuran kerusakan, kondisi sekitar, dan dampaknya bagi pengguna jalan. Contoh: lubang selebar 60 cm dengan kedalaman ±20 cm, menahan air hujan dan sulit terlihat saat malam."
                    className={cn(
                      'w-full rounded-lg p-3.5 font-body-md text-body-md text-on-surface bg-surface-container-lowest border-2 transition-all resize-y min-h-[140px] focus:outline-none focus:ring-2',
                      errors.deskripsi
                        ? 'border-status-rejected focus:ring-status-rejected'
                        : 'border-border-strong focus:border-primary focus:ring-primary/30',
                    )}
                  />
                  {errors.deskripsi ? (
                    <div className="flex items-start gap-1.5 text-status-rejected">
                      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                        warning
                      </span>
                      <p className="font-caption text-caption font-semibold">
                        {errors.deskripsi}
                      </p>
                    </div>
                  ) : (
                    <p className="font-caption text-caption text-on-surface-variant">
                      Tidak perlu menilai tingkat keparahan — cukup gambarkan apa
                      yang Anda lihat.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* ------------------------- STEP 4: RINGKASAN ------------------------ */}
            {step === 3 ? (
              <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      fact_check
                    </span>
                    Periksa Ringkasan Laporan
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Pastikan seluruh data sudah benar sebelum dikirim. Laporan akan
                    berstatus menunggu verifikasi Admin Kota.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {draft.photos.map((photo, index) => (
                    <img
                      key={`${photo}-${index}`}
                      src={photo}
                      alt={`Ringkasan foto ${index + 1}`}
                      className="w-full aspect-[4/3] object-cover rounded-md"
                    />
                  ))}
                </div>

                <div className="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                      Alamat
                    </span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold leading-snug">
                      {draft.alamat || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                        Koordinat
                      </span>
                      <span className="font-ticket text-caption text-on-surface tabular-nums">
                        {draft.latitude?.toFixed(6) ?? '—'}, {draft.longitude?.toFixed(6) ?? '—'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                        Jenis
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {draft.damageTypes
                          .map(
                            (type) =>
                              DAMAGE_TYPES.find((item) => item.value === type)?.label,
                          )
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
                      Deskripsi
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed whitespace-pre-line">
                      {draft.deskripsi || '—'}
                    </p>
                  </div>
                </div>

                {draft.latitude !== null && draft.longitude !== null ? (
                  <MapPicker
                    value={{ lat: draft.latitude, lng: draft.longitude }}
                    onChange={(lat, lng) =>
                      setDraft((current) => ({
                        ...current,
                        latitude: lat,
                        longitude: lng,
                      }))
                    }
                    height={220}
                  />
                ) : null}

                <div className="rounded-lg border border-border-subtle p-space-md flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      badge
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      Identitas Pelapor
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <dt className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">
                        Nama
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface">
                        {user?.nama ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">
                        Email
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface break-all">
                        {user?.email ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-caption text-[11px] text-on-surface-variant uppercase tracking-wider">
                        WhatsApp
                      </dt>
                      <dd className="font-body-sm text-body-sm text-on-surface tabular-nums">
                        {user?.noWa ?? '—'}
                      </dd>
                    </div>
                  </dl>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Identitas diambil dari akun Anda dan tidak dapat diubah dari
                    formulir ini.
                  </p>
                </div>

                <div className="rounded-lg bg-status-pending-soft p-space-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-pending text-[22px]">
                    schedule
                  </span>
                  <p className="font-body-sm text-body-sm text-status-pending leading-relaxed">
                    {mode === 'create' ? (
                      <>
                        Setelah dikirim, laporan berstatus{' '}
                        <strong>menunggu verifikasi</strong>. Laporan hanya tampil
                        di peta publik setelah disetujui Admin Kota. Anda masih
                        dapat mengubahnya selama status masih menunggu.
                      </>
                    ) : (
                      <>
                        Perubahan akan disimpan dengan status tetap{' '}
                        <strong>menunggu verifikasi</strong>. Laporan baru tampil di
                        peta publik setelah disetujui Admin Kota.
                      </>
                    )}
                  </p>
                </div>

                {submitError ? (
                  <div className="flex items-start gap-1.5 text-status-rejected">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                      error
                    </span>
                    <p className="font-caption text-caption font-semibold">
                      {submitError}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <footer className="pt-6 mt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
              {step === 0 ? (
                <Link
                  to={mode === 'create' ? '/laporan' : '/laporan/saya'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-md border border-border-strong text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Batal
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-md border border-border-strong text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Kembali
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant font-caption text-caption">
                <span className="material-symbols-outlined text-[18px] text-status-approved">
                  cloud_done
                </span>
                <span>Draf tersimpan di browser</span>
              </div>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] rounded-md bg-primary-container hover:bg-primary-hover text-on-primary transition-all font-label-md text-label-md font-bold shadow-card active:scale-95"
                >
                  <span>
                    {step === 0
                      ? 'Lanjut ke Lokasi'
                      : step === 1
                        ? 'Lanjut ke Detail'
                        : 'Lanjut ke Ringkasan'}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (!validateStep(2) || !validateStep(1) || !validateStep(0)) {
                      return
                    }
                    void onSubmit(draft).then(() => {
                      sessionStorage.removeItem(storageKey)
                    })
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] rounded-md bg-primary-container hover:bg-primary-hover text-on-primary transition-all font-label-md text-label-md font-bold shadow-card active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      {mode === 'create' ? 'Mengirim…' : 'Menyimpan…'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        {mode === 'create' ? 'send' : 'save'}
                      </span>
                      {mode === 'create' ? 'Kirim Laporan' : 'Simpan Perubahan'}
                    </>
                  )}
                </button>
              )}
            </footer>

            <p className="font-caption text-caption text-on-surface-variant text-center">
              {photoHint} • Terakhir disimpan{' '}
              {savedAt ? formatDateTime(savedAt.toISOString()) : formatDate(new Date().toISOString())}
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
