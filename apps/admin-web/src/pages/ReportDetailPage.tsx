import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DamageChips } from '../components/DamageChips'
import { ErrorState } from '../components/EmptyState'
import { MapMini } from '../components/MapMini'
import { PhotoGallery } from '../components/PhotoGallery'
import {
  ApproveReportDialog,
  CompleteReportDialog,
  DeleteReportDialog,
  RejectReportDialog,
  WithdrawReportDialog,
} from '../components/ReportDialogs'
import { Skeleton } from '../components/Skeleton'
import { ReportStatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import {
  ACTION_LABEL,
  type ReportStatus,
} from '../lib/types'
import {
  approveReport,
  completeReport,
  deleteReport,
  fetchReportById,
  rejectReport,
  republishReport,
  withdrawReport,
} from '../lib/store'
import { formatDateTime, formatTicket, waLink } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

type DialogType =
  | 'approve'
  | 'complete'
  | 'republish'
  | 'reject'
  | 'withdraw'
  | 'delete'
  | null

export function ReportDetailPage() {
  const { id } = useParams()
  const reportId = Number(id)
  const { admin, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogType>(null)

  const query = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReportById(reportId),
    enabled: Number.isFinite(reportId),
  })

  usePageTitle(
    query.data ? `Laporan ${formatTicket(query.data.report.ticketCode)}` : 'Laporan',
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['report', reportId] })
    void queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    void queryClient.invalidateQueries({ queryKey: ['report-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    void queryClient.invalidateQueries({ queryKey: ['citizen'] })
  }

  const approveMutation = useMutation({
    mutationFn: (mode: 'approve' | 'republish') =>
      mode === 'approve'
        ? approveReport(reportId, admin!)
        : republishReport(reportId, admin!),
    onSuccess: (_data, mode) => {
      invalidate()
      showToast(
        mode === 'approve'
          ? 'Laporan disetujui dan masuk status Proses.'
          : 'Laporan dipublikasikan ulang.',
      )
      setDialog(null)
    },
  })

  const completeMutation = useMutation({
    mutationFn: (photos: string[]) => completeReport(reportId, admin!, photos),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditandai selesai diperbaiki.')
      setDialog(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectReport(reportId, admin!, reason),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditolak.', 'info')
      setDialog(null)
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: (note: string) => withdrawReport(reportId, admin!, note || undefined),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditarik dari publikasi.', 'info')
      setDialog(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(reportId, admin!),
    onSuccess: () => {
      invalidate()
      showToast('Laporan dihapus permanen.', 'info')
      navigate('/laporan', { replace: true })
    },
  })

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[420px] rounded-lg" />
          <Skeleton className="h-[420px] rounded-lg" />
        </div>
      </div>
    )
  }

  if (query.isError) {
    return <ErrorState message="Laporan tidak dapat dimuat." onRetry={() => void query.refetch()} />
  }

  if (!query.data) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="material-symbols-outlined text-[48px] text-outline-variant">
            search_off
          </span>
          <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Laporan tidak ditemukan
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Data mungkin sudah dihapus atau tautan tidak valid.
          </p>
          <Link
            to="/laporan"
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-label-md text-label-md font-bold text-on-primary"
          >
            Kembali ke Laporan
          </Link>
        </div>
      </div>
    )
  }

  const { report, logs } = query.data
  const reporter = report.reporter

  return (
    <>
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <Link to="/laporan" className="hover:text-primary inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            Laporan
          </Link>
          <span>/</span>
          <span className="font-ticket font-bold text-on-surface">
            {formatTicket(report.ticketCode)}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface font-ticket">
              {formatTicket(report.ticketCode)}
            </h1>
            <ReportStatusBadge status={report.status} />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                {report.status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDialog('approve')}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog('reject')}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-status-rejected-soft font-label-md text-label-md font-bold text-status-rejected hover:bg-status-rejected hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Tolak
                    </button>
                  </>
                ) : null}

                {report.status === 'PROSES' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setDialog('complete')}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-status-approved text-white font-label-md text-label-md font-bold hover:bg-status-approved/90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      Tandai Diperbaiki
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog('withdraw')}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">undo</span>
                      Tarik
                    </button>
                  </>
                ) : null}

                {report.status === 'DIPERBAIKI' ? (
                  <button
                    type="button"
                    onClick={() => setDialog('withdraw')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">undo</span>
                    Tarik
                  </button>
                ) : null}

                {report.status === 'DITOLAK' ? (
                  <button
                    type="button"
                    onClick={() => setDialog('republish')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Setujui Ulang
                  </button>
                ) : null}

                {report.status === 'DITARIK' ? (
                  <button
                    type="button"
                    onClick={() => setDialog('republish')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover"
                  >
                    <span className="material-symbols-outlined text-[18px]">public</span>
                    Publikasikan Ulang
                  </button>
                ) : null}

                <Link
                  to={`/laporan/${report.id}/edit`}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDialog('delete')}
                  className="w-9 h-9 rounded-md border border-status-rejected/40 text-status-rejected hover:bg-status-rejected-soft flex items-center justify-center"
                  aria-label="Hapus laporan"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-4">
            <PhotoGallery photos={report.photos} alt={`Foto laporan ${report.ticketCode}`} />

            {report.repairPhotos.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-md bg-status-approved-soft/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-label-md text-label-md font-bold text-status-approved uppercase tracking-wider">
                    Bukti perbaikan
                  </h2>
                  <span className="font-caption text-caption text-status-approved font-semibold">
                    {report.repairPhotos.length} foto
                  </span>
                </div>
                <PhotoGallery
                  photos={report.repairPhotos}
                  alt={`Bukti perbaikan ${report.ticketCode}`}
                  height={300}
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5 min-w-0">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Alamat lengkap
              </h2>
              <p className="font-body-md text-body-md text-on-surface break-words [overflow-wrap:anywhere]">
                {report.alamat}
              </p>
            </div>

            <MapMini
              latitude={report.latitude}
              longitude={report.longitude}
              label={report.alamat}
            />

            <div className="flex flex-col gap-1.5">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Jenis kerusakan
              </h2>
              <DamageChips types={report.damageTypes} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
                Deskripsi pelapor
              </h2>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                {report.deskripsi}
              </p>
            </div>

            {report.rejectionReason ? (
              <div className="rounded-md bg-status-rejected-soft px-3 py-2.5">
                <p className="font-caption text-caption font-bold text-status-rejected uppercase tracking-wider mb-1">
                  Alasan penolakan
                </p>
                <p className="font-body-sm text-body-sm text-status-rejected">
                  {report.rejectionReason}
                </p>
              </div>
            ) : null}

            <dl className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-border-subtle">
              <div className="flex flex-col gap-0.5">
                <dt className="font-caption text-caption text-on-surface-variant">Tanggal lapor</dt>
                <dd className="font-body-sm text-body-sm font-semibold text-on-surface">
                  {formatDateTime(report.createdAt)} WIB
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-caption text-caption text-on-surface-variant">Terakhir diperbarui</dt>
                <dd className="font-body-sm text-body-sm font-semibold text-on-surface">
                  {formatDateTime(report.updatedAt)} WIB
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-caption text-caption text-on-surface-variant">Jumlah foto</dt>
                <dd className="font-body-sm text-body-sm font-semibold text-on-surface">
                  {report.photos.length} foto
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Data pelapor
            </h2>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-title text-title font-bold">
                {(reporter?.nama ?? 'W').slice(0, 1)}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-title text-body-md font-bold text-on-surface truncate">
                  {reporter?.nama ?? 'Warga tidak ditemukan'}
                </span>
                {reporter ? (
                  <span className="font-caption text-caption text-on-surface-variant truncate">
                    {reporter.email}
                  </span>
                ) : null}
              </div>
            </div>

            {reporter ? (
              <>
                <dl className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-caption text-caption text-on-surface-variant">WhatsApp</dt>
                    <dd>
                      <a
                        href={waLink(reporter.noWa)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-primary hover:underline tabular-nums"
                      >
                        {reporter.noWa}
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-caption text-caption text-on-surface-variant">Terdaftar</dt>
                    <dd className="font-body-sm text-body-sm text-on-surface">
                      {formatDateTime(reporter.createdAt)}
                    </dd>
                  </div>
                </dl>
                <Link
                  to={`/akun-warga/${reporter.id}`}
                  className="inline-flex items-center justify-center gap-1 h-9 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container"
                >
                  Lihat profil warga
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </>
            ) : null}
          </section>

          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Riwayat laporan
            </h2>
            <ol className="flex flex-col">
              {logs.map((log, index) => (
                <li key={log.id} className="flex gap-3 pb-3 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {index < logs.length - 1 ? (
                      <span className="w-px flex-1 bg-border-subtle mt-1" />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-1">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                      {ACTION_LABEL[log.action]}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {log.actorNama} · {formatDateTime(log.createdAt)}
                    </span>
                    <LogTransition from={log.fromStatus} to={log.toStatus} />
                    {log.note ? (
                      <p className="font-caption text-caption text-on-surface-variant italic mt-0.5">
                        “{log.note}”
                      </p>
                    ) : null}
                    {log.changes && Object.keys(log.changes).length > 0 ? (
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {Object.entries(log.changes).map(([field, change]) => (
                          <li key={field} className="font-caption text-[11px] text-on-surface-variant">
                            <span className="font-semibold">{field}</span>:{' '}
                            {change.from} → {change.to}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <ApproveReportDialog
        open={dialog === 'approve' || dialog === 'republish'}
        ticketCode={report.ticketCode}
        mode={dialog === 'republish' ? 'republish' : 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await approveMutation.mutateAsync(dialog === 'republish' ? 'republish' : 'approve')
        }}
      />

      {dialog === 'complete' ? (
        <CompleteReportDialog
          open
          ticketCode={report.ticketCode}
          onClose={() => setDialog(null)}
          onConfirm={async (photos) => {
            await completeMutation.mutateAsync(photos)
          }}
        />
      ) : null}

      <RejectReportDialog
        open={dialog === 'reject'}
        ticketCode={report.ticketCode}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          await rejectMutation.mutateAsync(reason)
        }}
      />

      <WithdrawReportDialog
        open={dialog === 'withdraw'}
        ticketCode={report.ticketCode}
        onClose={() => setDialog(null)}
        onConfirm={async (note) => {
          await withdrawMutation.mutateAsync(note)
        }}
      />

      <DeleteReportDialog
        open={dialog === 'delete'}
        ticketCode={report.ticketCode}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync()
        }}
      />
    </>
  )
}

function LogTransition({
  from,
  to,
}: {
  from: ReportStatus | null
  to: ReportStatus | null
}) {
  if (!from && !to) return null
  return (
    <span className="font-caption text-[11px] text-on-surface-variant">
      {from ? DAMAGE_LABEL_STATUS[from] : 'Baru'} → {to ? DAMAGE_LABEL_STATUS[to] : 'Dihapus'}
    </span>
  )
}

const DAMAGE_LABEL_STATUS: Record<ReportStatus, string> = {
  PENDING: 'Menunggu',
  PROSES: 'Proses',
  DIPERBAIKI: 'Diperbaiki',
  DITOLAK: 'Ditolak',
  DITARIK: 'Ditarik',
}
