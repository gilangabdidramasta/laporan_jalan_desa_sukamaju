import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DamageChips } from '../components/DamageChips'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import {
  ApproveReportDialog,
  CompleteReportDialog,
  RejectReportDialog,
  WithdrawReportDialog,
} from '../components/ReportDialogs'
import { Skeleton, TableSkeleton } from '../components/Skeleton'
import { ReportStatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatTicket } from '../lib/format'
import {
  approveReport,
  completeReport,
  fetchReportStats,
  fetchReports,
  rejectReport,
  withdrawReport,
  type AdminReport,
} from '../lib/store'
import {
  DAMAGE_LABEL,
  DAMAGE_TYPES,
  REPORT_STATUSES,
  type DamageType,
  type ReportStatus,
} from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

const TABS: Array<{ value: ReportStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  ...REPORT_STATUSES.map((status) => ({
    value: status.value,
    label: status.shortLabel,
  })),
]

type DialogState =
  | { type: 'approve'; report: AdminReport }
  | { type: 'complete'; report: AdminReport }
  | { type: 'reject'; report: AdminReport }
  | { type: 'withdraw'; report: AdminReport }
  | null

const STATUS_ACCENT: Record<ReportStatus, string> = {
  PENDING: 'text-status-pending bg-status-pending-soft',
  PROSES: 'text-secondary bg-secondary-soft',
  DIPERBAIKI: 'text-status-approved bg-status-approved-soft',
  DITOLAK: 'text-status-rejected bg-status-rejected-soft',
  DITARIK: 'text-status-withdrawn bg-status-withdrawn-soft',
}

export function ReportsListPage() {
  usePageTitle('Laporan')
  const { admin, isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const status = (params.get('status') ?? 'PENDING') as ReportStatus | 'ALL'
  const q = params.get('q') ?? ''
  const jenisParam = params.get('jenis') ?? ''
  const jenis = jenisParam.split(',').filter(Boolean) as DamageType[]
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const perPage = Number(params.get('perPage') ?? '20') || 20

  const [search, setSearch] = useState(q)
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    setSearch(q)
  }, [q])

  useEffect(() => {
    if (search === q) return
    const timer = window.setTimeout(() => {
      updateParams({ q: search, page: 1 })
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function updateParams(next: Record<string, string | number | undefined>) {
    const copy = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL') {
        copy.delete(key)
      } else {
        copy.set(key, String(value))
      }
    })
    setParams(copy, { replace: true })
  }

  const statsQuery = useQuery({
    queryKey: ['report-stats'],
    queryFn: fetchReportStats,
  })

  const listQuery = useQuery({
    queryKey: ['admin-reports', status, q, jenisParam, from, to, page, perPage],
    queryFn: () =>
      fetchReports({
        status,
        q,
        damageTypes: jenis,
        from: from || undefined,
        to: to || undefined,
        page,
        perPage,
      }),
    placeholderData: (previous) => previous,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    void queryClient.invalidateQueries({ queryKey: ['report-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['pending-count'] })
    void queryClient.invalidateQueries({ queryKey: ['report'] })
  }

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveReport(id, admin!),
    onSuccess: () => {
      invalidate()
      showToast('Laporan disetujui dan masuk status Proses.')
      setDialog(null)
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, photos }: { id: number; photos: string[] }) =>
      completeReport(id, admin!, photos),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditandai selesai diperbaiki.')
      setDialog(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectReport(id, admin!, reason),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditolak. Alasan dikirim ke pelapor.', 'info')
      setDialog(null)
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      withdrawReport(id, admin!, note || undefined),
    onSuccess: () => {
      invalidate()
      showToast('Laporan ditarik dari publikasi.', 'info')
      setDialog(null)
    },
  })

  const stats = statsQuery.data
  const reports = listQuery.data?.items ?? []
  const hasFilters = Boolean(q || jenisParam || from || to || status !== 'PENDING')

  const resetFilters = () => {
    setSearch('')
    setParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
            Laporan Jalan Rusak Kota Pekanbaru
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Verifikasi laporan warga sebelum tayang di website publik.
          </p>
        </div>
        <p className="font-caption text-caption text-on-surface-variant">
          {isAdmin
            ? 'Mode admin · Anda dapat memverifikasi laporan.'
            : 'Mode baca saja · aksi verifikasi dinonaktifkan.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsQuery.isLoading || !stats
          ? Array.from({ length: REPORT_STATUSES.length }).map((_, index) => (
              <Skeleton key={index} className="h-[92px] rounded-lg" />
            ))
          : REPORT_STATUSES.map((item) => {
              const active = status === item.value
              const value = stats[item.value]
              const icon = item.icon
              const accent = STATUS_ACCENT[item.value]
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    updateParams({
                      status: active ? 'ALL' : item.value,
                      page: 1,
                    })
                  }
                  className={cn(
                    'rounded-lg border bg-surface-container-lowest p-4 flex items-center gap-3 text-left transition-all',
                    active
                      ? 'border-primary shadow-card ring-1 ring-primary/20'
                      : 'border-border-subtle hover:border-primary/40 hover:shadow-card',
                  )}
                >
                  <span
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      accent,
                    )}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {icon}
                    </span>
                  </span>
                  <span className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface tabular-nums">
                      {value}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {item.label}
                    </span>
                  </span>
                </button>
              )
            })}
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-border-subtle">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateParams({ status: tab.value, page: 1 })}
                className={cn(
                  'px-3 sm:px-4 py-3 font-label-md text-label-md whitespace-nowrap border-b-2 transition-colors',
                  status === tab.value
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-3 bg-surface-container-low/50">
          <div className="flex flex-col lg:flex-row gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Cari laporan</span>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode tiket, nama pelapor, atau alamat…"
                className="h-10 w-full rounded-md border border-border-strong bg-surface-container-lowest pl-9 pr-3 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
                <span className="whitespace-nowrap">Dari</span>
                <input
                  type="date"
                  value={from}
                  onChange={(event) =>
                    updateParams({ from: event.target.value, page: 1 })
                  }
                  className="h-10 rounded-md border border-border-strong bg-surface-container-lowest px-2 font-body-sm text-body-sm outline-none focus:border-primary"
                />
              </label>
              <label className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
                <span className="whitespace-nowrap">s.d.</span>
                <input
                  type="date"
                  value={to}
                  onChange={(event) =>
                    updateParams({ to: event.target.value, page: 1 })
                  }
                  className="h-10 rounded-md border border-border-strong bg-surface-container-lowest px-2 font-body-sm text-body-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-caption text-caption text-on-surface-variant mr-1 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              Jenis:
            </span>
            {DAMAGE_TYPES.map((type) => {
              const active = jenis.includes(type.value)
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? jenis.filter((item) => item !== type.value)
                      : [...jenis, type.value]
                    updateParams({
                      jenis: next.length > 0 ? next.join(',') : undefined,
                      page: 1,
                    })
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full border font-caption text-caption font-semibold transition-colors',
                    active
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'bg-surface-container-lowest border-border-strong text-on-surface-variant hover:border-secondary/50 hover:text-secondary',
                  )}
                >
                  {DAMAGE_LABEL[type.value]}
                </button>
              )
            })}

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-caption text-caption font-bold text-status-rejected hover:bg-status-rejected-soft"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset filter
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative">
          {listQuery.isFetching && !listQuery.isLoading ? (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-[fade-up_1s_linear_infinite]" />
            </div>
          ) : null}

          {listQuery.isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : listQuery.isError ? (
            <ErrorState
              message="Data laporan tidak dapat dimuat."
              onRetry={() => void listQuery.refetch()}
            />
          ) : reports.length === 0 ? (
            <EmptyState
              icon="search_off"
              title={hasFilters ? 'Tidak ada laporan yang cocok.' : 'Belum ada laporan masuk.'}
              description={
                hasFilters
                  ? 'Coba ubah kata kunci, rentang tanggal, atau reset filter.'
                  : 'Laporan dari warga akan muncul di sini untuk diverifikasi.'
              }
              action={
                hasFilters
                  ? { label: 'Reset filter', onClick: resetFilters }
                  : undefined
              }
            />
          ) : (
            <>
              <table className="hidden md:table w-full text-left">
                <thead className="bg-surface-container-low/70 text-on-surface-variant">
                  <tr className="font-caption text-caption uppercase tracking-wider">
                    <th className="px-3 py-2.5 font-bold w-16">Foto</th>
                    <th className="px-3 py-2.5 font-bold">Kode Tiket</th>
                    <th className="px-3 py-2.5 font-bold">Pelapor</th>
                    <th className="px-3 py-2.5 font-bold">Alamat</th>
                    <th className="px-3 py-2.5 font-bold">Jenis</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Tanggal</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                    <th className="px-3 py-2.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-3 py-2.5">
                        <img
                          src={report.photos[0]}
                          alt=""
                          loading="lazy"
                          className="w-14 h-11 rounded object-cover bg-surface-container"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/laporan/${report.id}`}
                          className="font-ticket text-ticket-code text-primary font-bold hover:underline whitespace-nowrap"
                        >
                          {formatTicket(report.ticketCode)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface whitespace-nowrap">
                        {report.reporter?.nama ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant max-w-[220px]">
                        <span className="truncate block">{report.alamat}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <DamageChips types={report.damageTypes} size="sm" />
                      </td>
                      <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <ReportStatusBadge status={report.status} compact />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && report.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setDialog({ type: 'approve', report })}
                                className="w-8 h-8 rounded-md bg-status-approved-soft text-status-approved hover:bg-status-approved hover:text-white flex items-center justify-center transition-colors"
                                title="Setujui"
                                aria-label="Setujui laporan"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  check
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDialog({ type: 'reject', report })}
                                className="w-8 h-8 rounded-md bg-status-rejected-soft text-status-rejected hover:bg-status-rejected hover:text-white flex items-center justify-center transition-colors"
                                title="Tolak"
                                aria-label="Tolak laporan"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  close
                                </span>
                              </button>
                            </>
                          ) : null}
                          {isAdmin && report.status === 'PROSES' ? (
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'complete', report })}
                              className="w-8 h-8 rounded-md bg-status-approved-soft text-status-approved hover:bg-status-approved hover:text-white flex items-center justify-center transition-colors"
                              title="Tandai selesai diperbaiki"
                              aria-label="Tandai laporan selesai diperbaiki"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                check_circle
                              </span>
                            </button>
                          ) : null}
                          {isAdmin &&
                          (report.status === 'PROSES' || report.status === 'DIPERBAIKI') ? (
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'withdraw', report })}
                              className="w-8 h-8 rounded-md bg-status-withdrawn-soft text-status-withdrawn hover:bg-status-withdrawn hover:text-white flex items-center justify-center transition-colors"
                              title="Tarik dari publikasi"
                              aria-label="Tarik laporan"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                undo
                              </span>
                            </button>
                          ) : null}
                          <Link
                            to={`/laporan/${report.id}`}
                            className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container transition-colors inline-flex items-center"
                          >
                            Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="md:hidden divide-y divide-border-subtle">
                {reports.map((report) => (
                  <article key={report.id} className="p-3 flex flex-col gap-2">
                    <div className="flex gap-3">
                      <img
                        src={report.photos[0]}
                        alt=""
                        loading="lazy"
                        className="w-20 h-16 rounded object-cover bg-surface-container shrink-0"
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <Link
                          to={`/laporan/${report.id}`}
                          className="font-ticket text-ticket-code text-primary font-bold"
                        >
                          {formatTicket(report.ticketCode)}
                        </Link>
                        <span className="font-body-sm text-body-sm text-on-surface truncate">
                          {report.reporter?.nama ?? '—'}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant truncate">
                          {report.alamat}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <ReportStatusBadge status={report.status} compact />
                      <div className="flex items-center gap-1">
                        {isAdmin && report.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'approve', report })}
                              className="h-8 px-2.5 rounded-md bg-status-approved-soft text-status-approved font-caption text-caption font-bold"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'reject', report })}
                              className="h-8 px-2.5 rounded-md bg-status-rejected-soft text-status-rejected font-caption text-caption font-bold"
                            >
                              Tolak
                            </button>
                          </>
                        ) : null}
                        {isAdmin && report.status === 'PROSES' ? (
                          <button
                            type="button"
                            onClick={() => setDialog({ type: 'complete', report })}
                            className="h-8 px-2.5 rounded-md bg-status-approved-soft text-status-approved font-caption text-caption font-bold"
                          >
                            Selesai
                          </button>
                        ) : null}
                        {isAdmin &&
                        (report.status === 'PROSES' || report.status === 'DIPERBAIKI') ? (
                          <button
                            type="button"
                            onClick={() => setDialog({ type: 'withdraw', report })}
                            className="h-8 px-2.5 rounded-md bg-status-withdrawn-soft text-status-withdrawn font-caption text-caption font-bold"
                          >
                            Tarik
                          </button>
                        ) : null}
                        <Link
                          to={`/laporan/${report.id}`}
                          className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface inline-flex items-center"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        {listQuery.data ? (
          <Pagination
            page={listQuery.data.page}
            totalPages={listQuery.data.totalPages}
            total={listQuery.data.total}
            perPage={listQuery.data.perPage}
            onPageChange={(next) => updateParams({ page: next })}
            onPerPageChange={(next) => updateParams({ perPage: next, page: 1 })}
            perPageOptions={[20, 50, 100]}
          />
        ) : null}
      </section>

      <ApproveReportDialog
        open={dialog?.type === 'approve'}
        ticketCode={dialog?.type === 'approve' ? dialog.report.ticketCode : ''}
        mode="approve"
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          if (dialog?.type !== 'approve') return
          await approveMutation.mutateAsync(dialog.report.id)
        }}
      />

      {dialog?.type === 'complete' ? (
        <CompleteReportDialog
          open
          ticketCode={dialog.report.ticketCode}
          onClose={() => setDialog(null)}
          onConfirm={async (photos) => {
            await completeMutation.mutateAsync({ id: dialog.report.id, photos })
          }}
        />
      ) : null}

      <RejectReportDialog
        open={dialog?.type === 'reject'}
        ticketCode={dialog?.type === 'reject' ? dialog.report.ticketCode : ''}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          if (dialog?.type !== 'reject') return
          await rejectMutation.mutateAsync({ id: dialog.report.id, reason })
        }}
      />

      <WithdrawReportDialog
        open={dialog?.type === 'withdraw'}
        ticketCode={dialog?.type === 'withdraw' ? dialog.report.ticketCode : ''}
        onClose={() => setDialog(null)}
        onConfirm={async (note) => {
          if (dialog?.type !== 'withdraw') return
          await withdrawMutation.mutateAsync({ id: dialog.report.id, note })
        }}
      />
    </>
  )
}
