import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ActionDialog } from '../components/ActionDialog'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import { Skeleton, TableSkeleton } from '../components/Skeleton'
import { AccountStatusBadge } from '../components/StatusBadge'
import { TempPasswordDialog } from '../components/TempPasswordDialog'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { cn, formatDate } from '../lib/format'
import {
  fetchCitizenStats,
  fetchCitizens,
  resetCitizenPassword,
  setCitizenStatus,
  type CitizenRow,
} from '../lib/store'
import type { AccountStatus } from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

const TABS: Array<{ value: AccountStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'NONAKTIF', label: 'Nonaktif' },
]

export function CitizensListPage() {
  usePageTitle('Akun Warga')
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const status = (params.get('status') ?? 'ALL') as AccountStatus | 'ALL'
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const perPage = Number(params.get('perPage') ?? '20') || 20

  const [search, setSearch] = useState(q)
  const [statusTarget, setStatusTarget] = useState<CitizenRow | null>(null)
  const [resetTarget, setResetTarget] = useState<CitizenRow | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  useEffect(() => {
    setSearch(q)
  }, [q])

  useEffect(() => {
    if (search === q) return
    const timer = window.setTimeout(() => updateParams({ q: search, page: 1 }), 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function updateParams(next: Record<string, string | number | undefined>) {
    const copy = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL') copy.delete(key)
      else copy.set(key, String(value))
    })
    setParams(copy, { replace: true })
  }

  const statsQuery = useQuery({
    queryKey: ['citizen-stats'],
    queryFn: fetchCitizenStats,
  })

  const query = useQuery({
    queryKey: ['citizens', status, q, page, perPage],
    queryFn: () => fetchCitizens({ status, q, page, perPage }),
    placeholderData: (previous) => previous,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: AccountStatus }) =>
      setCitizenStatus(id, next),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['citizens'] })
      void queryClient.invalidateQueries({ queryKey: ['citizen-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['citizen'] })
      showToast(
        variables.next === 'AKTIF'
          ? 'Akun warga diaktifkan kembali.'
          : 'Akun warga dinonaktifkan.',
        'info',
      )
      setStatusTarget(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: (id: number) => resetCitizenPassword(id),
    onSuccess: (password) => {
      setTempPassword(password)
      showToast('Password warga berhasil direset.')
    },
  })

  const items = query.data?.items ?? []
  const stats = statsQuery.data
  const hasFilters = Boolean(q || status !== 'ALL')

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
            Akun Warga
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Kelola akun warga yang dapat mengirim laporan jalan rusak.
          </p>
        </div>
        <p className="font-caption text-caption text-on-surface-variant">
          Warga mendaftar sendiri melalui website publik.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {statsQuery.isLoading || !stats ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[84px] rounded-lg" />
          ))
        ) : (
          <>
            <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface tabular-nums">
                {stats.total}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Total warga
              </span>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-status-approved tabular-nums">
                {stats.aktif}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Akun aktif
              </span>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-status-withdrawn tabular-nums">
                {stats.nonaktif}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                Nonaktif
              </span>
            </div>
          </>
        )}
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-border-subtle flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ status: tab.value, page: 1 })}
              className={cn(
                'px-4 py-3 font-label-md text-label-md whitespace-nowrap border-b-2 transition-colors',
                status === tab.value
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-4 bg-surface-container-low/50">
          <label className="relative block max-w-md">
            <span className="sr-only">Cari warga</span>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, atau nomor WhatsApp…"
              className="h-10 w-full rounded-md border border-border-strong bg-surface-container-lowest pl-9 pr-3 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        {query.isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : query.isError ? (
          <ErrorState message="Data warga tidak dapat dimuat." onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="group_off"
            title={hasFilters ? 'Tidak ada akun yang cocok.' : 'Belum ada akun warga.'}
            description={
              hasFilters
                ? 'Coba ubah kata kunci atau filter status.'
                : 'Akun warga akan muncul di sini setelah warga mendaftar.'
            }
            action={
              hasFilters
                ? {
                    label: 'Reset filter',
                    onClick: () => {
                      setSearch('')
                      setParams(new URLSearchParams(), { replace: true })
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            <table className="hidden md:table w-full text-left">
              <thead className="bg-surface-container-low/70 text-on-surface-variant">
                <tr className="font-caption text-caption uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-bold">Nama</th>
                  <th className="px-3 py-2.5 font-bold">Email</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">WhatsApp</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">Terdaftar</th>
                  <th className="px-3 py-2.5 font-bold">Laporan</th>
                  <th className="px-3 py-2.5 font-bold">Status</th>
                  <th className="px-3 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((citizen) => (
                  <tr key={citizen.id} className="hover:bg-surface-container-low/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-caption text-caption font-bold shrink-0">
                          {citizen.nama.slice(0, 1)}
                        </span>
                        <Link
                          to={`/akun-warga/${citizen.id}`}
                          className="font-body-sm text-body-sm font-bold text-on-surface hover:text-primary whitespace-nowrap"
                        >
                          {citizen.nama}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant">
                      {citizen.email}
                    </td>
                    <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant tabular-nums whitespace-nowrap">
                      {citizen.noWa}
                    </td>
                    <td className="px-3 py-2.5 font-caption text-caption text-on-surface-variant whitespace-nowrap">
                      {formatDate(citizen.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/laporan?q=${encodeURIComponent(citizen.nama)}`}
                        className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-secondary hover:underline tabular-nums"
                      >
                        {citizen.reportCount}
                        <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <AccountStatusBadge status={citizen.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/akun-warga/${citizen.id}`}
                          className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container inline-flex items-center"
                        >
                          Detail
                        </Link>
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setStatusTarget(citizen)}
                              className={cn(
                                'w-8 h-8 rounded-md flex items-center justify-center',
                                citizen.status === 'AKTIF'
                                  ? 'text-status-rejected hover:bg-status-rejected-soft'
                                  : 'text-status-approved hover:bg-status-approved-soft',
                              )}
                              title={
                                citizen.status === 'AKTIF'
                                  ? 'Nonaktifkan akun'
                                  : 'Aktifkan akun'
                              }
                              aria-label={
                                citizen.status === 'AKTIF'
                                  ? 'Nonaktifkan akun'
                                  : 'Aktifkan akun'
                              }
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {citizen.status === 'AKTIF' ? 'block' : 'check_circle'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(citizen)
                                setTempPassword(null)
                              }}
                              className="w-8 h-8 rounded-md text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
                              title="Reset password"
                              aria-label="Reset password"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                key
                              </span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-border-subtle">
              {items.map((citizen) => (
                <article key={citizen.id} className="p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-caption text-caption font-bold shrink-0">
                        {citizen.nama.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/akun-warga/${citizen.id}`}
                          className="font-body-sm text-body-sm font-bold text-on-surface truncate block"
                        >
                          {citizen.nama}
                        </Link>
                        <span className="font-caption text-caption text-on-surface-variant truncate block">
                          {citizen.email}
                        </span>
                      </div>
                    </div>
                    <AccountStatusBadge status={citizen.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-caption text-caption text-on-surface-variant">
                      {citizen.reportCount} laporan · {formatDate(citizen.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/akun-warga/${citizen.id}`}
                        className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold inline-flex items-center"
                      >
                        Detail
                      </Link>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setStatusTarget(citizen)}
                          className="h-8 px-2.5 rounded-md bg-surface-container font-caption text-caption font-bold text-on-surface"
                        >
                          {citizen.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {query.data ? (
          <Pagination
            page={query.data.page}
            totalPages={query.data.totalPages}
            total={query.data.total}
            perPage={query.data.perPage}
            onPageChange={(next) => updateParams({ page: next })}
            onPerPageChange={(next) => updateParams({ perPage: next, page: 1 })}
            perPageOptions={[20, 50, 100]}
          />
        ) : null}
      </section>

      <ActionDialog
        open={Boolean(statusTarget)}
        title={
          statusTarget?.status === 'AKTIF' ? 'Nonaktifkan akun warga?' : 'Aktifkan kembali akun?'
        }
        description={
          statusTarget?.status === 'AKTIF'
            ? `${statusTarget?.nama} tidak akan bisa masuk dan mengirim laporan. Laporan yang sudah ada tetap tersimpan.`
            : `${statusTarget?.nama} dapat kembali masuk dan mengirim laporan.`
        }
        confirmLabel={statusTarget?.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
        variant={statusTarget?.status === 'AKTIF' ? 'danger' : 'primary'}
        loading={statusMutation.isPending}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => {
          if (!statusTarget) return
          statusMutation.mutate({
            id: statusTarget.id,
            next: statusTarget.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF',
          })
        }}
      />

      <ActionDialog
        open={Boolean(resetTarget) && !tempPassword}
        title="Reset password warga?"
        description={
          resetTarget
            ? `Password lama ${resetTarget.nama} akan diganti dengan password sementara.`
            : undefined
        }
        confirmLabel="Reset Password"
        loading={resetMutation.isPending}
        onClose={() => setResetTarget(null)}
        onConfirm={() => {
          if (resetTarget) resetMutation.mutate(resetTarget.id)
        }}
      >
        <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
          Warga tidak dapat mengubah password sendiri. Setelah reset, sampaikan
          password sementara secara langsung atau melalui WhatsApp terdaftar.
        </p>
      </ActionDialog>

      <TempPasswordDialog
        open={Boolean(tempPassword)}
        password={tempPassword}
        targetName={resetTarget?.nama ?? ''}
        onClose={() => {
          setTempPassword(null)
          setResetTarget(null)
        }}
      />
    </>
  )
}
