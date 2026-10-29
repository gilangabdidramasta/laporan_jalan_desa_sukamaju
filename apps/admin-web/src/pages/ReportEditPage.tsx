import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/EmptyState'
import { MapPicker } from '../components/MapPicker'
import { PhotoUploader } from '../components/PhotoUploader'
import { ActionDialog } from '../components/ActionDialog'
import { Skeleton } from '../components/Skeleton'
import { ReportStatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatTicket } from '../lib/format'
import { fetchReportById, updateReport } from '../lib/store'
import {
  DAMAGE_TYPES,
  type DamageType,
  type ReportEditDraft,
} from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

export function ReportEditPage() {
  const { id } = useParams()
  const reportId = Number(id)
  const { admin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReportById(reportId),
    enabled: Number.isFinite(reportId),
  })

  usePageTitle(
    query.data
      ? `Edit Laporan ${formatTicket(query.data.report.ticketCode)}`
      : 'Edit Laporan',
  )

  const [draft, setDraft] = useState<ReportEditDraft | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (!query.data || draft) return
    const { report } = query.data
    setDraft({
      photos: report.photos,
      alamat: report.alamat,
      latitude: report.latitude,
      longitude: report.longitude,
      damageTypes: report.damageTypes,
      deskripsi: report.deskripsi,
      note: '',
    })
  }, [query.data, draft])

  const original = query.data?.report

  const changed = useMemo(() => {
    if (!draft || !original) return false
    return (
      draft.alamat !== original.alamat ||
      draft.deskripsi !== original.deskripsi ||
      draft.damageTypes.join(',') !== original.damageTypes.join(',') ||
      draft.photos.join(',') !== original.photos.join(',') ||
      draft.latitude !== original.latitude ||
      draft.longitude !== original.longitude
    )
  }, [draft, original])

  const mutation = useMutation({
    mutationFn: (payload: ReportEditDraft) => updateReport(reportId, admin!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['report', reportId] })
      void queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      showToast('Perubahan laporan disimpan.')
      navigate(`/laporan/${reportId}`)
    },
  })

  if (query.isLoading || !draft) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    )
  }

  if (query.isError) {
    return <ErrorState message="Laporan tidak dapat dimuat." onRetry={() => void query.refetch()} />
  }

  if (!query.data || !original) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16 text-center">
        <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Laporan tidak ditemukan
        </p>
        <Link to="/laporan" className="mt-2 inline-flex font-label-md text-label-md text-primary font-bold">
          Kembali ke Laporan
        </Link>
      </div>
    )
  }

  const toggleType = (type: DamageType) => {
    setDraft((current) => {
      if (!current) return current
      const active = current.damageTypes.includes(type)
      return {
        ...current,
        damageTypes: active
          ? current.damageTypes.filter((item) => item !== type)
          : [...current.damageTypes, type],
      }
    })
  }

  const handleCancel = () => {
    if (changed) setConfirmCancel(true)
    else navigate(`/laporan/${reportId}`)
  }

  const canSave = changed && draft.alamat.trim().length > 0 && draft.damageTypes.length > 0 && draft.photos.length > 0

  return (
    <>
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <Link to="/laporan" className="hover:text-primary">
            Laporan
          </Link>
          <span>/</span>
          <Link to={`/laporan/${reportId}`} className="font-ticket hover:text-primary">
            {formatTicket(original.ticketCode)}
          </Link>
          <span>/</span>
          <span>Edit</span>
        </nav>
        <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
          Edit Laporan Warga
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Perbaiki data laporan tanpa mengubah status verifikasi.
        </p>
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-container-lowest px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-col">
          <span className="font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
            Kode tiket
          </span>
          <span className="font-ticket text-ticket-code font-bold text-secondary">
            {formatTicket(original.ticketCode)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
            Status
          </span>
          <ReportStatusBadge status={original.status} compact />
        </div>
        <div className="flex flex-col">
          <span className="font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
            Pelapor
          </span>
          <span className="font-body-sm text-body-sm font-semibold text-on-surface">
            {query.data.report.reporter?.nama ?? '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
            Dilaporkan
          </span>
          <span className="font-body-sm text-body-sm text-on-surface">
            {formatDate(original.createdAt)}
          </span>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSave) return
          mutation.mutate(draft)
        }}
        className="grid lg:grid-cols-3 gap-4 items-start"
      >
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-container-lowest p-4">
          <PhotoUploader
            photos={draft.photos}
            onChange={(photos) => setDraft((current) => (current ? { ...current, photos } : current))}
          />

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Alamat lengkap <span className="text-tertiary">*</span>
            </span>
            <textarea
              value={draft.alamat}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, alamat: event.target.value } : current))
              }
              rows={2}
              className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Titik koordinat <span className="text-tertiary">*</span>
            </span>
            <MapPicker
              value={{ lat: draft.latitude, lng: draft.longitude }}
              onChange={(lat, lng) =>
                setDraft((current) => (current ? { ...current, latitude: lat, longitude: lng } : current))
              }
              height={280}
            />
            <span className="font-caption text-caption text-on-surface-variant tabular-nums">
              {draft.latitude !== null && draft.longitude !== null
                ? `${draft.latitude.toFixed(6)}, ${draft.longitude.toFixed(6)}`
                : 'Belum ada titik dipilih'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Jenis kerusakan <span className="text-tertiary">*</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DAMAGE_TYPES.map((type) => {
                const active = draft.damageTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleType(type.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border font-label-md text-label-md font-semibold transition-colors',
                      active
                        ? 'bg-secondary text-on-secondary border-secondary'
                        : 'bg-surface-container-lowest border-border-strong text-on-surface-variant hover:border-secondary/50',
                    )}
                  >
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Deskripsi <span className="text-tertiary">*</span>
            </span>
            <textarea
              value={draft.deskripsi}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, deskripsi: event.target.value } : current))
              }
              rows={5}
              className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Catatan perubahan
            </h2>
            <textarea
              value={draft.note}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, note: event.target.value } : current))
              }
              rows={4}
              placeholder="Opsional. Dicatat pada riwayat laporan."
              className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
            />
            <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
              Setiap perubahan field akan tercatat otomatis pada riwayat laporan
              sebagai aksi “Data laporan diperbarui”.
            </p>
          </section>

          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-2">
            {mutation.isError ? (
              <p className="font-caption text-caption font-semibold text-status-rejected">
                {mutation.error instanceof Error ? mutation.error.message : 'Gagal menyimpan.'}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canSave || mutation.isPending}
              className="h-10 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {mutation.isPending ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-10 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container"
            >
              Batal
            </button>
            {!changed ? (
              <p className="font-caption text-caption text-on-surface-variant text-center">
                Belum ada perubahan.
              </p>
            ) : null}
          </section>
        </div>
      </form>

      <ActionDialog
        open={confirmCancel}
        title="Batalkan perubahan?"
        description="Perubahan yang belum disimpan akan hilang."
        confirmLabel="Ya, batalkan"
        variant="danger"
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false)
          navigate(`/laporan/${reportId}`)
        }}
      />
    </>
  )
}
