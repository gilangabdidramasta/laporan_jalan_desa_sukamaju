import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DamageChips } from '../components/DamageChips'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../lib/auth'
import { cn, formatDateTime, formatTicket } from '../lib/format'
import { fetchMyReports } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import type { ReportStatus } from '../lib/types'

const TABS: { value: 'ALL' | ReportStatus; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'PROSES', label: 'Proses' },
  { value: 'DIPERBAIKI', label: 'Diperbaiki' },
  { value: 'DITOLAK', label: 'Ditolak' },
  { value: 'DITARIK', label: 'Ditarik' },
]

const STATS: {
  status: ReportStatus
  label: string
  icon: string
  note: string
  color: string
  bg: string
}[] = [
  {
    status: 'PENDING',
    label: 'Menunggu Verifikasi',
    icon: 'schedule',
    note: 'Sedang diperiksa Admin Kota',
    color: 'text-status-pending',
    bg: 'bg-status-pending/10',
  },
  {
    status: 'PROSES',
    label: 'Sedang Diproses',
    icon: 'construction',
    note: 'Sedang ditangani instansi terkait',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    status: 'DIPERBAIKI',
    label: 'Selesai Diperbaiki',
    icon: 'check_circle',
    note: 'Perbaikan telah selesai',
    color: 'text-status-approved',
    bg: 'bg-status-approved/10',
  },
  {
    status: 'DITOLAK',
    label: 'Ditolak',
    icon: 'cancel',
    note: 'Perlu perbaikan data',
    color: 'text-status-rejected',
    bg: 'bg-status-rejected/10',
  },
  {
    status: 'DITARIK',
    label: 'Ditarik',
    icon: 'undo',
    note: 'Tidak lagi tampil publik',
    color: 'text-status-withdrawn',
    bg: 'bg-status-withdrawn/10',
  },
]

export function MyReportsPage() {
  usePageTitle('Laporan Saya')
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<'ALL' | ReportStatus>('ALL')

  const highlight = searchParams.get('sukses')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: () => fetchMyReports(user!.id),
    enabled: Boolean(user),
  })

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: reports.length }
    for (const stat of STATS) {
      result[stat.status] = reports.filter((r) => r.status === stat.status).length
    }
    return result
  }, [reports])

  const filtered = useMemo(
    () => (tab === 'ALL' ? reports : reports.filter((r) => r.status === tab)),
    [reports, tab],
  )

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark pt-8 pb-16">
        <div className="max-w-[1100px] mx-auto px-margin lg:px-margin-desktop flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 font-caption text-caption text-primary-fixed-dim mb-1"
            >
              <Link to="/" className="hover:text-on-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">home</span>
                Beranda
              </Link>
              <span className="text-primary-fixed-dim/50">/</span>
              <span className="text-on-primary font-medium">Laporan Saya</span>
            </nav>
            <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tight">
              Laporan Saya
            </h1>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-1 max-w-2xl">
              Pantau status verifikasi dan tindak lanjut laporan jalan rusak yang
              telah Anda kirimkan secara transparan.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              to="/laporan/baru"
              className="inline-flex items-center gap-2 px-space-lg py-3 rounded-lg bg-primary-container hover:bg-primary-hover text-on-primary shadow-card transition-colors font-title text-body-md font-bold"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Buat Laporan Baru
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1100px] mx-auto px-margin lg:px-margin-desktop -mt-10 mb-16">
        <div className="bg-surface-container-lowest rounded-xl shadow-card p-5 lg:p-8 flex flex-col gap-8">
          {highlight ? (
            <div className="rounded-lg bg-primary-soft px-4 py-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-status-approved text-[20px]">
                check_circle
              </span>
              <div className="flex-1">
                <p className="font-label-md text-label-md text-primary font-bold">
                  Laporan {highlight} berhasil dikirim
                </p>
                <p className="font-caption text-caption text-primary/90">
                  Status saat ini menunggu verifikasi Admin Kota.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.delete('sukses')
                  setSearchParams(params, { replace: true })
                }}
                className="w-8 h-8 rounded-md hover:bg-primary/10 flex items-center justify-center text-primary"
                aria-label="Tutup pemberitahuan"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : null}

          <section aria-label="Ringkasan status laporan">
            <h2 className="sr-only">Ringkasan Status Laporan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.status}
                  className="bg-surface-container-low rounded-lg p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                      {stat.label}
                    </span>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        stat.bg,
                        stat.color,
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {stat.icon}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={cn(
                        'font-headline-lg text-headline-lg font-bold leading-none tabular-nums',
                        stat.color,
                      )}
                    >
                      {isLoading ? '—' : counts[stat.status] ?? 0}
                    </span>
                    <p className="font-caption text-caption text-on-surface-variant mt-1">
                      {stat.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div
              className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-container-low rounded-lg"
              role="tablist"
              aria-label="Filter status"
            >
              {TABS.map((item) => {
                const active = tab === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.value)}
                    className={cn(
                      'px-4 py-2 rounded-md font-label-md text-label-md transition-all',
                      active
                        ? 'bg-surface-container-lowest text-primary shadow-card font-bold'
                        : 'text-on-surface-variant hover:text-on-surface font-medium',
                    )}
                  >
                    {item.label} ({counts[item.value] ?? 0})
                  </button>
                )
              })}
            </div>
            <div className="font-caption text-caption text-on-surface-variant">
              Menampilkan{' '}
              <span className="font-bold text-on-surface">{filtered.length} laporan</span>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl p-5 shadow-card flex flex-col md:flex-row gap-6"
                >
                  <Skeleton className="w-full md:w-64 h-48 rounded-lg" />
                  <div className="flex-1 flex flex-col gap-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="folder_open"
                title={
                  reports.length === 0
                    ? 'Belum Ada Laporan'
                    : 'Tidak Ada Laporan pada Filter Ini'
                }
                description={
                  reports.length === 0
                    ? 'Laporkan jalan rusak di sekitar Anda agar dapat diverifikasi dan dipetakan oleh Pemerintah Kota.'
                    : 'Coba pilih tab status lain untuk melihat laporan Anda.'
                }
                actionLabel={reports.length === 0 ? 'Buat Laporan Pertama' : undefined}
                actionTo={reports.length === 0 ? '/laporan/baru' : undefined}
              />
            ) : (
              filtered.map((report) => (
                <article
                  key={report.id}
                  className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row gap-5 hover:shadow-card-hover transition-shadow"
                >
                  <div className="w-full md:w-56 lg:w-64 shrink-0 rounded-lg overflow-hidden bg-surface-container-high relative aspect-[4/3] md:aspect-auto md:h-auto md:min-h-[160px]">
                    {report.photos[0] ? (
                      <img
                        src={report.photos[0]}
                        alt={`Foto kerusakan di ${report.alamat}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/60">
                        <span className="material-symbols-outlined text-[32px]">
                          image_not_supported
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-surface-dark/80 text-on-primary font-caption text-caption backdrop-blur-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                      {report.photos.length} Foto
                    </span>
                  </div>

                  <div className="flex flex-col justify-between flex-grow gap-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-ticket text-ticket-code text-on-surface font-bold tabular-nums">
                            {formatTicket(report.ticketCode)}
                          </span>
                          <span className="text-on-surface-variant/40">•</span>
                          <span className="font-caption text-caption text-on-surface-variant">
                            {formatDateTime(report.createdAt)} WIB
                          </span>
                        </div>
                        <StatusBadge status={report.status} />
                      </div>

                      <h3 className="font-title text-title text-on-surface font-bold mb-2 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                          location_on
                        </span>
                        {report.alamat}
                      </h3>

                      <DamageChips types={report.damageTypes} className="mb-3" />

                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">
                        {report.deskripsi}
                      </p>

                      {report.status === 'PENDING' ? (
                        <div className="mt-3 p-3 rounded-md bg-status-pending-soft/60 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-status-pending text-[18px] mt-0.5 shrink-0">
                            info
                          </span>
                          <p className="font-caption text-caption text-status-pending leading-normal">
                            Laporan Anda berada di antrean peninjauan Admin Kota.
                            Anda masih dapat memperbarui data selama status masih
                            menunggu.
                          </p>
                        </div>
                      ) : null}

                      {report.status === 'PROSES' ? (
                        <div className="mt-3 p-3 rounded-md bg-secondary-soft/70 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">
                            construction
                          </span>
                          <p className="font-caption text-caption text-secondary leading-normal">
                            Laporan telah disetujui dan sedang diproses untuk
                            diperbaiki oleh instansi terkait.
                          </p>
                        </div>
                      ) : null}

                      {report.status === 'DIPERBAIKI' ? (
                        <div className="mt-3 p-3 rounded-md bg-status-approved-soft/70 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-status-approved text-[18px] mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <p className="font-caption text-caption text-status-approved leading-normal">
                            Perbaikan jalan telah selesai. Bukti perbaikan dapat
                            dilihat pada detail laporan.
                          </p>
                        </div>
                      ) : null}

                      {report.status === 'DITOLAK' && report.rejectionReason ? (
                        <div className="mt-3 p-3 rounded-md bg-status-rejected-soft/70 flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-status-rejected text-[18px] mt-0.5 shrink-0">
                            cancel
                          </span>
                          <div>
                            <p className="font-caption text-caption text-status-rejected font-bold">
                              Alasan penolakan
                            </p>
                            <p className="font-caption text-caption text-status-rejected/90 leading-normal mt-0.5">
                              {report.rejectionReason}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {report.status === 'DITARIK' ? (
                        <div className="mt-3 p-3 rounded-md bg-status-withdrawn-soft flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-status-withdrawn text-[18px] mt-0.5 shrink-0">
                            undo
                          </span>
                          <p className="font-caption text-caption text-status-withdrawn leading-normal">
                            Laporan ini ditarik dari publikasi oleh Admin Kota.
                            Data tetap tersimpan untuk keperluan evaluasi.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {report.status === 'PENDING' ? (
                        <Link
                          to={`/laporan/${encodeURIComponent(report.ticketCode)}/edit`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-soft hover:bg-primary/20 text-primary font-label-md text-label-md font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit Laporan
                        </Link>
                      ) : null}
                      <Link
                        to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-medium transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          visibility
                        </span>
                        Lihat Detail
                      </Link>
                      {report.status === 'DITOLAK' ? (
                        <Link
                          to="/laporan/baru"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border-strong hover:bg-surface-container-low text-on-surface font-label-md text-label-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            add_circle
                          </span>
                          Kirim Laporan Baru
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
