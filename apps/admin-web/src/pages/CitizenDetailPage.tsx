import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActionDialog } from '../components/ActionDialog'
import { DamageChips } from '../components/DamageChips'
import { ErrorState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { AccountStatusBadge, ReportStatusBadge } from '../components/StatusBadge'
import { TempPasswordDialog } from '../components/TempPasswordDialog'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import {
  formatDate,
  formatDateTime,
  formatTicket,
  waLink,
} from '../lib/format'
import {
  fetchCitizenById,
  resetCitizenPassword,
  setCitizenStatus,
} from '../lib/store'
import { REPORT_STATUSES, type ReportStatus } from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

export function CitizenDetailPage() {
  const { id } = useParams()
  const citizenId = Number(id)
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [confirmStatus, setConfirmStatus] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['citizen', citizenId],
    queryFn: () => fetchCitizenById(citizenId),
    enabled: Number.isFinite(citizenId),
  })

  usePageTitle(query.data ? query.data.citizen.nama : 'Detail Warga')

  const statusMutation = useMutation({
    mutationFn: (next: 'AKTIF' | 'NONAKTIF') => setCitizenStatus(citizenId, next),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['citizen', citizenId] })
      void queryClient.invalidateQueries({ queryKey: ['citizens'] })
      void queryClient.invalidateQueries({ queryKey: ['citizen-stats'] })
      showToast('Status akun diperbarui.', 'info')
      setConfirmStatus(false)
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => resetCitizenPassword(citizenId),
    onSuccess: (password) => {
      setTempPassword(password)
      showToast('Password warga berhasil direset.')
    },
  })

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[220px] rounded-lg" />
        <Skeleton className="h-[320px] rounded-lg" />
      </div>
    )
  }

  if (query.isError) {
    return <ErrorState message="Data warga tidak dapat dimuat." onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16 text-center">
        <span className="material-symbols-outlined text-[44px] text-outline-variant">
          person_off
        </span>
        <p className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">
          Warga tidak ditemukan
        </p>
        <Link
          to="/akun-warga"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-label-md text-label-md font-bold text-on-primary"
        >
          Kembali ke Akun Warga
        </Link>
      </div>
    )
  }

  const { citizen, reports } = query.data
  const counts = reports.reduce<Record<ReportStatus, number>>(
    (acc, report) => {
      acc[report.status] += 1
      return acc
    },
    { PENDING: 0, PROSES: 0, DIPERBAIKI: 0, DITOLAK: 0, DITARIK: 0 },
  )

  return (
    <>
      <div className="flex flex-col gap-1">
        <nav className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <Link to="/akun-warga" className="hover:text-primary inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            Akun Warga
          </Link>
          <span>/</span>
          <span className="text-on-surface">{citizen.nama}</span>
        </nav>
        <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
          Detail Akun Warga
        </h1>
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center font-heading text-[26px] font-bold shrink-0">
          {citizen.nama.slice(0, 1)}
        </span>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-title text-title font-bold text-on-surface">{citizen.nama}</h2>
            <AccountStatusBadge status={citizen.status} />
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{citizen.email}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <a
              href={waLink(citizen.noWa)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-caption text-caption font-semibold text-primary hover:underline tabular-nums"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              {citizen.noWa}
            </a>
            <span className="font-caption text-caption text-on-surface-variant">
              Terdaftar {formatDate(citizen.createdAt)}
            </span>
            <span className="font-caption text-caption text-on-surface-variant">
              {reports.length} laporan
            </span>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmStatus(true)}
              className={
                citizen.status === 'AKTIF'
                  ? 'h-9 px-3 rounded-md border border-status-rejected/40 font-label-md text-label-md font-bold text-status-rejected hover:bg-status-rejected-soft'
                  : 'h-9 px-3 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover'
              }
            >
              {citizen.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmReset(true)
                setTempPassword(null)
              }}
              className="h-9 px-3 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">key</span>
              Reset Password
            </button>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_STATUSES.map((status) => (
          <div
            key={status.value}
            className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex items-center gap-2.5"
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              {status.icon}
            </span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface tabular-nums">
                {counts[status.value]}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                {status.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
          <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
            Laporan warga ini
          </h2>
          <Link
            to={`/laporan?q=${encodeURIComponent(citizen.nama)}`}
            className="font-caption text-caption font-bold text-primary hover:underline"
          >
            Lihat di daftar laporan
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 gap-1">
            <span className="material-symbols-outlined text-[40px] text-outline-variant">
              inbox
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Warga ini belum pernah mengirim laporan.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  to={`/laporan/${report.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low/50"
                >
                  <img
                    src={report.photos[0]}
                    alt=""
                    loading="lazy"
                    className="w-14 h-11 rounded object-cover bg-surface-container shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="font-ticket text-ticket-code font-bold text-primary">
                      {formatTicket(report.ticketCode)}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant truncate">
                      {report.alamat}
                    </span>
                    <span className="font-caption text-[11px] text-on-surface-variant">
                      {formatDateTime(report.createdAt)} WIB
                    </span>
                  </div>
                  <div className="hidden sm:block shrink-0">
                    <DamageChips types={report.damageTypes} size="sm" />
                  </div>
                  <ReportStatusBadge status={report.status} compact />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActionDialog
        open={confirmStatus}
        title={citizen.status === 'AKTIF' ? 'Nonaktifkan akun warga?' : 'Aktifkan kembali akun?'}
        description={
          citizen.status === 'AKTIF'
            ? `${citizen.nama} tidak akan bisa masuk dan mengirim laporan. Laporan yang sudah ada tetap tersimpan.`
            : `${citizen.nama} dapat kembali masuk dan mengirim laporan.`
        }
        confirmLabel={citizen.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
        variant={citizen.status === 'AKTIF' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
        onClose={() => setConfirmStatus(false)}
        onConfirm={() =>
          statusMutation.mutate(citizen.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF')
        }
      />

      <ActionDialog
        open={confirmReset && !tempPassword}
        title="Reset password warga?"
        description={`Password lama ${citizen.nama} akan diganti dengan password sementara.`}
        confirmLabel="Reset Password"
        loading={resetMutation.isPending}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => resetMutation.mutate()}
      >
        <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
          Warga tidak dapat mengubah password sendiri. Sampaikan password sementara
          secara langsung atau melalui WhatsApp terdaftar.
        </p>
      </ActionDialog>

      <TempPasswordDialog
        open={Boolean(tempPassword)}
        password={tempPassword}
        targetName={citizen.nama}
        onClose={() => {
          setTempPassword(null)
          setConfirmReset(false)
        }}
      />
    </>
  )
}
