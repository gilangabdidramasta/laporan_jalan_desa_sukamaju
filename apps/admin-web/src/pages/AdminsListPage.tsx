import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ActionDialog } from '../components/ActionDialog'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import { TableSkeleton } from '../components/Skeleton'
import { AccountStatusBadge, RoleBadge } from '../components/StatusBadge'
import { TempPasswordDialog } from '../components/TempPasswordDialog'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatDateTime } from '../lib/format'
import {
  fetchAdmins,
  resetAdminPassword,
  setAdminStatus,
} from '../lib/store'
import type { Admin, AdminRole } from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

const TABS: Array<{ value: AdminRole | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

export function AdminsListPage() {
  usePageTitle('Akun Admin')
  const { admin: current } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const role = (params.get('role') ?? 'ALL') as AdminRole | 'ALL'
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const perPage = Number(params.get('perPage') ?? '20') || 20

  const [search, setSearch] = useState(q)
  const [statusTarget, setStatusTarget] = useState<Admin | null>(null)
  const [resetTarget, setResetTarget] = useState<Admin | null>(null)
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

  const query = useQuery({
    queryKey: ['admins', role, q, page, perPage],
    queryFn: () => fetchAdmins({ role, q, page, perPage }),
    placeholderData: (previous) => previous,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: 'AKTIF' | 'NONAKTIF' }) =>
      setAdminStatus(id, next),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admins'] })
      showToast(
        variables.next === 'AKTIF'
          ? 'Akun admin diaktifkan.'
          : 'Akun admin dinonaktifkan.',
        'info',
      )
      setStatusTarget(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: (id: number) => resetAdminPassword(id),
    onSuccess: (password) => {
      setTempPassword(password)
      showToast('Password admin berhasil direset.')
    },
  })

  const items = query.data?.items ?? []
  const hasFilters = Boolean(q || role !== 'ALL')

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
            Akun Admin
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Kelola akses pengelola dashboard. Hanya Super Admin yang dapat menambah
            atau menonaktifkan admin.
          </p>
        </div>
        <Link
          to="/akun-admin/baru"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover self-start"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah Admin
        </Link>
      </div>

      <section className="rounded-lg border border-border-subtle bg-surface-container-lowest overflow-hidden">
        <div className="border-b border-border-subtle flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ role: tab.value, page: 1 })}
              className={cn(
                'px-4 py-3 font-label-md text-label-md whitespace-nowrap border-b-2 transition-colors',
                role === tab.value
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
            <span className="sr-only">Cari admin</span>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau email admin…"
              className="h-10 w-full rounded-md border border-border-strong bg-surface-container-lowest pl-9 pr-3 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        {query.isLoading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : query.isError ? (
          <ErrorState message="Data admin tidak dapat dimuat." onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="manage_accounts"
            title={hasFilters ? 'Tidak ada admin yang cocok.' : 'Belum ada akun admin.'}
            description={
              hasFilters
                ? 'Coba ubah kata kunci atau filter peran.'
                : 'Tambahkan akun admin untuk membantu verifikasi laporan.'
            }
            action={hasFilters ? undefined : { label: 'Tambah Admin', to: '/akun-admin/baru' }}
          />
        ) : (
          <>
            <table className="hidden md:table w-full text-left">
              <thead className="bg-surface-container-low/70 text-on-surface-variant">
                <tr className="font-caption text-caption uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-bold">Nama</th>
                  <th className="px-3 py-2.5 font-bold">Email</th>
                  <th className="px-3 py-2.5 font-bold">Peran</th>
                  <th className="px-3 py-2.5 font-bold">Status</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">Terakhir Masuk</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">Dibuat</th>
                  <th className="px-3 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((item) => {
                  const isSelf = item.id === current?.id
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/40">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-caption text-caption font-bold shrink-0">
                            {item.nama.slice(0, 1)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm font-bold text-on-surface whitespace-nowrap">
                              {item.nama}
                            </span>
                            {isSelf ? (
                              <span className="font-caption text-[11px] text-primary font-semibold">
                                Akun Anda
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant">
                        {item.email}
                      </td>
                      <td className="px-3 py-2.5">
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="px-3 py-2.5">
                        <AccountStatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-2.5 font-caption text-caption text-on-surface-variant whitespace-nowrap">
                        {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : 'Belum pernah'}
                      </td>
                      <td className="px-3 py-2.5 font-caption text-caption text-on-surface-variant whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setResetTarget(item)
                              setTempPassword(null)
                            }}
                            className="w-8 h-8 rounded-md text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
                            title="Reset password"
                            aria-label="Reset password"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setStatusTarget(item)}
                            className={cn(
                              'w-8 h-8 rounded-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed',
                              item.status === 'AKTIF'
                                ? 'text-status-rejected hover:bg-status-rejected-soft'
                                : 'text-status-approved hover:bg-status-approved-soft',
                            )}
                            title={
                              isSelf
                                ? 'Tidak dapat menonaktifkan akun sendiri'
                                : item.status === 'AKTIF'
                                  ? 'Nonaktifkan akun'
                                  : 'Aktifkan akun'
                            }
                            aria-label={
                              item.status === 'AKTIF' ? 'Nonaktifkan akun' : 'Aktifkan akun'
                            }
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {item.status === 'AKTIF' ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-border-subtle">
              {items.map((item) => {
                const isSelf = item.id === current?.id
                return (
                  <article key={item.id} className="p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-caption text-caption font-bold shrink-0">
                          {item.nama.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-body-sm text-body-sm font-bold text-on-surface truncate">
                            {item.nama}
                          </p>
                          <p className="font-caption text-caption text-on-surface-variant truncate">
                            {item.email}
                          </p>
                        </div>
                      </div>
                      <AccountStatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <RoleBadge role={item.role} />
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => setStatusTarget(item)}
                        className="h-8 px-2.5 rounded-md bg-surface-container font-caption text-caption font-bold disabled:opacity-40"
                      >
                        {item.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </article>
                )
              })}
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
          statusTarget?.status === 'AKTIF' ? 'Nonaktifkan akun admin?' : 'Aktifkan kembali akun?'
        }
        description={
          statusTarget?.status === 'AKTIF'
            ? `${statusTarget?.nama} tidak akan bisa masuk ke dashboard. Laporan dan berita yang pernah dibuat tetap tersimpan.`
            : `${statusTarget?.nama} dapat kembali masuk ke dashboard.`
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
        title="Reset password admin?"
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
          Sampaikan password sementara kepada admin terkait melalui kanal resmi.
          Password hanya ditampilkan satu kali.
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
