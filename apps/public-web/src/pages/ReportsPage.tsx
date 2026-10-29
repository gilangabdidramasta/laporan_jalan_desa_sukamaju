import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DamageChips } from '../components/DamageChips'
import { EmptyState } from '../components/EmptyState'
import { MapView } from '../components/MapView'
import { ReportCardSkeleton, Skeleton } from '../components/Skeleton'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatTicket } from '../lib/format'
import { fetchPublicReports } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { VILLAGE } from '../lib/village'
import { DAMAGE_TYPES, type DamageType } from '../lib/types'

const PER_PAGE = 9
const STATUS_FILTERS: Array<{ value: 'PROSES' | 'DIPERBAIKI'; label: string }> = [
  { value: 'PROSES', label: 'Proses' },
  { value: 'DIPERBAIKI', label: 'Diperbaiki' },
]

export function ReportsPage() {
  usePageTitle('Laporan Jalan Rusak')
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const ticketFromUrl = searchParams.get('ticket') ?? ''
  const rawStatus = searchParams.get('status')
  const statusFromUrl =
    rawStatus === 'PROSES' || rawStatus === 'DIPERBAIKI' ? rawStatus : undefined
  const jenisFromUrl = (searchParams.get('jenis') ?? '')
    .split(',')
    .filter(Boolean) as DamageType[]
  const pageFromUrl = Number(searchParams.get('page') ?? '1') || 1

  const [ticketInput, setTicketInput] = useState(ticketFromUrl)
  const [selected, setSelected] = useState<DamageType[]>(jenisFromUrl)

  useEffect(() => {
    setTicketInput(ticketFromUrl)
  }, [ticketFromUrl])

  useEffect(() => {
    setSelected(jenisFromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('jenis')])

  const updateParams = (next: {
    ticket?: string
    jenis?: DamageType[]
    status?: 'PROSES' | 'DIPERBAIKI' | null
    page?: number
  }) => {
    const params = new URLSearchParams(searchParams)
    if (next.ticket !== undefined) {
      if (next.ticket) params.set('ticket', next.ticket)
      else params.delete('ticket')
    }
    if (next.jenis !== undefined) {
      if (next.jenis.length > 0) params.set('jenis', next.jenis.join(','))
      else params.delete('jenis')
    }
    if (next.status !== undefined) {
      if (next.status) params.set('status', next.status)
      else params.delete('status')
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page))
      else params.delete('page')
    }
    setSearchParams(params, { replace: true })
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'public-reports',
      ticketFromUrl,
      jenisFromUrl.join(','),
      statusFromUrl ?? '',
      pageFromUrl,
    ],
    queryFn: () =>
      fetchPublicReports({
        ticket: ticketFromUrl,
        damageTypes: jenisFromUrl,
        status: statusFromUrl,
        page: pageFromUrl,
        perPage: PER_PAGE,
      }),
  })

  const mapQuery = useQuery({
    queryKey: ['public-reports', 'map'],
    queryFn: () => fetchPublicReports({ status: 'PROSES', perPage: 200 }),
  })

  const reports = data?.items ?? []
  const mapReports = mapQuery.data?.items ?? []
  const total = data?.total ?? 0

  const toggleType = (type: DamageType) => {
    const next = selected.includes(type)
      ? selected.filter((item) => item !== type)
      : [...selected, type]
    setSelected(next)
    updateParams({ jenis: next, page: 1 })
  }

  const resetFilters = () => {
    setSelected([])
    setTicketInput('')
    setSearchParams({}, { replace: true })
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    updateParams({ ticket: ticketInput.trim(), page: 1 })
  }

  const hasFilter =
    selected.length > 0 || ticketFromUrl.length > 0 || Boolean(statusFromUrl)

  const summary = useMemo(() => {
    if (isLoading) return 'Memuat laporan…'
    if (total === 0) {
      return hasFilter ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'
    }
    return `${total} laporan ditemukan`
  }, [hasFilter, isLoading, total])

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark py-space-xl pb-16">
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop">
          <div className="flex flex-col gap-space-xs max-w-4xl">
            <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tight mt-space-xs">
              Laporan Jalan Rusak {VILLAGE.nama}
            </h1>
            <p className="font-body-md text-body-md text-on-primary/85 leading-relaxed">
              Pantau laporan jalan rusak yang sedang diproses hingga selesai
              diperbaiki oleh instansi terkait.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop w-full -mt-10 mb-space-xl">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-card p-space-md lg:p-space-lg flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">map</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Peta Sebaran Jalan Rusak
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Titik jalan yang masih dalam proses perbaikan di wilayah{' '}
                {VILLAGE.namaPendek}. Laporan selesai diperbaiki tetap ada di
                daftar dan detail laporan.
              </p>
            </div>
            <Link
              to={isAuthenticated ? '/laporan/baru' : '/masuk?redirect=/laporan/baru'}
              className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-primary text-on-primary font-title text-title hover:bg-primary-hover shadow-card transition-colors self-start md:self-auto group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-90 duration-300">
                add
              </span>
              <span>Buat Laporan Baru</span>
            </Link>
          </div>

          <div className="relative isolate">
            {mapQuery.isLoading ? (
              <Skeleton className="w-full h-[420px] md:h-[480px] rounded-lg" />
            ) : (
              <MapView reports={mapReports} height={480} />
            )}
            <div className="absolute bottom-4 left-4 z-[400] bg-surface-container-lowest/95 backdrop-blur-md px-3.5 py-2 rounded-md shadow-card flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-status-rejected shadow-sm" />
              <span className="font-caption text-caption text-on-surface font-semibold">
                {mapReports.length} Titik Sedang Diproses
              </span>
              {mapQuery.isFetching && !mapQuery.isLoading ? (
                <span className="font-caption text-caption text-on-surface-variant">
                  • memperbarui
                </span>
              ) : null}
            </div>
          </div>

          {/* Filter */}
          <div className="w-full bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-md text-label-md text-on-surface-variant mr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Kategori:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected([])
                    updateParams({ jenis: [], page: 1 })
                  }}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors shadow-card',
                    selected.length === 0
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container',
                  )}
                  aria-pressed={selected.length === 0}
                >
                  Semua
                </button>
                {DAMAGE_TYPES.map((type) => {
                  const active = selected.includes(type.value)
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleType(type.value)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors shadow-card flex items-center gap-1',
                        active
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                      )}
                      aria-pressed={active}
                    >
                      <span>{type.label}</span>
                      {active ? (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-caption text-caption self-end lg:self-auto transition-colors min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Reset filter</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border-subtle">
              <span className="font-label-md text-label-md text-on-surface-variant mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                Status:
              </span>
              <button
                type="button"
                onClick={() => updateParams({ status: null, page: 1 })}
                className={cn(
                  'px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors shadow-card',
                  !statusFromUrl
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container',
                )}
                aria-pressed={!statusFromUrl}
              >
                Semua
              </button>
              {STATUS_FILTERS.map((item) => {
                const active = statusFromUrl === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      updateParams({ status: active ? null : item.value, page: 1 })
                    }
                    className={cn(
                      'px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors shadow-card flex items-center gap-1',
                      active
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                    )}
                    aria-pressed={active}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <label htmlFor="filter-ticket" className="sr-only">
                  Cari kode tiket atau nama jalan
                </label>
                <input
                  id="filter-ticket"
                  value={ticketInput}
                  onChange={(event) => setTicketInput(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-md bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Cari kode tiket (#RPT-YYYYMMDD-XXX) atau nama ruas jalan…"
                  type="search"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[44px] rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">manage_search</span>
                <span>Telusuri</span>
              </button>
            </form>

            {hasFilter ? (
              <div className="flex flex-wrap items-center gap-2 font-caption text-caption text-on-surface-variant">
                <span>Filter aktif:</span>
                {selected.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary px-2 py-0.5 font-semibold"
                  >
                    {DAMAGE_TYPES.find((item) => item.value === type)?.label}
                  </span>
                ))}
                {statusFromUrl ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft text-secondary px-2 py-0.5 font-semibold">
                    {STATUS_FILTERS.find((item) => item.value === statusFromUrl)?.label}
                  </span>
                ) : null}
                {ticketFromUrl ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft text-secondary px-2 py-0.5 font-semibold">
                    “{ticketFromUrl}”
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="underline hover:text-primary"
                >
                  hapus semua
                </button>
              </div>
            ) : null}
          </div>

          {/* Hasil */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Daftar Laporan
              </h3>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {summary}
              </span>
            </div>

            {isError ? (
              <div className="flex flex-col items-center py-space-xl text-center">
                <span className="material-symbols-outlined text-[36px] text-status-rejected">
                  error
                </span>
                <p className="font-body-md text-body-md text-on-surface mt-space-sm">
                  Gagal memuat data laporan.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-space-sm px-4 py-2 rounded-md bg-primary text-on-primary font-label-md text-label-md"
                >
                  Coba lagi
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ReportCardSkeleton key={index} />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon="search_off"
                title={
                  hasFilter
                    ? 'Tidak Ada Laporan yang Cocok'
                    : 'Belum Ada Laporan'
                }
                description={
                  hasFilter
                    ? 'Coba ubah kata kunci atau hapus sebagian filter yang aktif.'
                    : 'Laporan terbaru mungkin masih dalam tahap verifikasi Admin Kota.'
                }
                actionLabel={hasFilter ? 'Reset Filter' : undefined}
                onAction={hasFilter ? resetFilters : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
                {reports.map((report) => (
                  <article
                    key={report.id}
                    className="bg-surface-container-lowest rounded-lg border border-border-subtle shadow-card hover:shadow-card-hover transition-shadow duration-200 flex flex-col overflow-hidden group"
                  >
                    <Link
                      to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
                      className="relative block w-full aspect-[4/3] overflow-hidden bg-surface-container"
                    >
                      <img
                        src={report.photos[0]}
                        alt={`Kerusakan jalan di ${report.alamat}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                    <div className="p-space-md flex flex-col flex-1 justify-between gap-space-sm">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-space-xs">
                          <span className="font-ticket text-ticket-code text-primary font-bold tabular-nums truncate">
                            {formatTicket(report.ticketCode)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <StatusBadge status={report.status} size="sm" />
                            <span className="font-caption text-caption text-on-surface-variant">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-title text-title text-on-surface font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {report.alamat}
                        </h4>
                        <DamageChips types={report.damageTypes} size="sm" className="mt-1" />
                      </div>
                      <div className="pt-space-sm border-t border-surface-container flex items-center justify-between mt-2 gap-space-xs">
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-caption text-caption min-w-0">
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            account_circle
                          </span>
                          <span className="truncate">Dilaporkan oleh {report.reporterNama}</span>
                        </div>
                        <Link
                          to={`/laporan/${encodeURIComponent(report.ticketCode)}`}
                          className="font-label-md text-label-md text-primary font-bold hover:text-primary-hover flex items-center gap-0.5 shrink-0"
                        >
                          Detail
                          <span className="material-symbols-outlined text-[14px]">
                            chevron_right
                          </span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {data && data.totalPages > 1 ? (
              <nav
                className="mt-space-lg flex items-center justify-center gap-1.5"
                aria-label="Navigasi halaman"
              >
                <button
                  type="button"
                  onClick={() => updateParams({ page: pageFromUrl - 1 })}
                  disabled={pageFromUrl <= 1}
                  className="w-10 h-10 rounded-md bg-surface-container-lowest border border-border-subtle flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low"
                  aria-label="Halaman sebelumnya"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({ length: data.totalPages }).map((_, index) => {
                  const page = index + 1
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => updateParams({ page })}
                      aria-current={page === data.page ? 'page' : undefined}
                      className={cn(
                        'w-10 h-10 rounded-md font-label-md text-label-md transition-colors',
                        page === data.page
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-lowest border border-border-subtle text-on-surface hover:bg-surface-container-low',
                      )}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => updateParams({ page: pageFromUrl + 1 })}
                  disabled={pageFromUrl >= data.totalPages}
                  className="w-10 h-10 rounded-md bg-surface-container-lowest border border-border-subtle flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low"
                  aria-label="Halaman berikutnya"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
