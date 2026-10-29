import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ActionDialog } from '../components/ActionDialog'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { Pagination } from '../components/Pagination'
import { TableSkeleton } from '../components/Skeleton'
import { NewsStatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { cn, formatDate, formatDateTime } from '../lib/format'
import { deleteNews, fetchNewsList, unpublishNews } from '../lib/store'
import type { NewsItem, NewsStatus } from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

const TABS: Array<{ value: NewsStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: 'DRAFT', label: 'Draf' },
  { value: 'TERBIT', label: 'Terbit' },
]

export function NewsListPage() {
  usePageTitle('Berita')
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const status = (params.get('status') ?? 'ALL') as NewsStatus | 'ALL'
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const perPage = Number(params.get('perPage') ?? '20') || 20

  const [search, setSearch] = useState(q)
  const [preview, setPreview] = useState<NewsItem | null>(null)
  const [toDelete, setToDelete] = useState<NewsItem | null>(null)

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
    queryKey: ['admin-news', status, q, page, perPage],
    queryFn: () => fetchNewsList({ status, q, page, perPage }),
    placeholderData: (previous) => previous,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNews(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      showToast('Berita dihapus.', 'info')
      setToDelete(null)
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: (id: number) => unpublishNews(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      showToast('Berita ditarik ke draf.', 'info')
    },
  })

  const items = query.data?.items ?? []
  const hasFilters = Boolean(q || status !== 'ALL')

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
            Berita Kota
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Kelola kabar dan informasi Kota Pekanbaru yang tampil di website publik.
          </p>
        </div>
        {isAdmin ? (
          <Link
            to="/berita/baru"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover self-start"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tulis Berita
          </Link>
        ) : null}
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
            <span className="sr-only">Cari berita</span>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul atau slug…"
              className="h-10 w-full rounded-md border border-border-strong bg-surface-container-lowest pl-9 pr-3 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>

        {query.isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : query.isError ? (
          <ErrorState message="Berita tidak dapat dimuat." onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="newspaper"
            title={hasFilters ? 'Tidak ada berita yang cocok.' : 'Belum ada berita.'}
            description={
              hasFilters
                ? 'Coba ubah kata kunci atau filter status.'
                : 'Publikasikan kabar terbaru seputar pembangunan jalan dan kegiatan kota.'
            }
            action={
              isAdmin && !hasFilters
                ? { label: 'Tulis Berita Pertama', to: '/berita/baru' }
                : undefined
            }
          />
        ) : (
          <>
            <table className="hidden md:table w-full text-left">
              <thead className="bg-surface-container-low/70 text-on-surface-variant">
                <tr className="font-caption text-caption uppercase tracking-wider">
                  <th className="px-3 py-2.5 font-bold w-20">Sampul</th>
                  <th className="px-3 py-2.5 font-bold">Judul</th>
                  <th className="px-3 py-2.5 font-bold">Status</th>
                  <th className="px-3 py-2.5 font-bold">Penulis</th>
                  <th className="px-3 py-2.5 font-bold whitespace-nowrap">Tanggal</th>
                  <th className="px-3 py-2.5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/40">
                    <td className="px-3 py-2.5">
                      <img
                        src={item.cover || undefined}
                        alt=""
                        loading="lazy"
                        className="w-16 h-11 rounded object-cover bg-surface-container"
                      />
                    </td>
                    <td className="px-3 py-2.5 max-w-[380px]">
                      <p className="font-body-sm text-body-sm font-bold text-on-surface line-clamp-2">
                        {item.judul}
                      </p>
                      <p className="font-caption text-[11px] text-on-surface-variant truncate">
                        /{item.slug}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <NewsStatusBadge status={item.status} />
                    </td>
                    <td className="px-3 py-2.5 font-body-sm text-body-sm text-on-surface whitespace-nowrap">
                      {item.authorNama}
                    </td>
                    <td className="px-3 py-2.5 font-caption text-caption text-on-surface-variant whitespace-nowrap">
                      {item.status === 'TERBIT' && item.publishedAt
                        ? formatDate(item.publishedAt)
                        : formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setPreview(item)}
                          className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container"
                        >
                          Lihat
                        </button>
                        {isAdmin ? (
                          <>
                            <Link
                              to={`/berita/${item.id}/edit`}
                              className="w-8 h-8 rounded-md text-on-surface-variant hover:bg-surface-container flex items-center justify-center"
                              aria-label={`Edit ${item.judul}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => setToDelete(item)}
                              className="w-8 h-8 rounded-md text-status-rejected hover:bg-status-rejected-soft flex items-center justify-center"
                              aria-label={`Hapus ${item.judul}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
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
              {items.map((item) => (
                <article key={item.id} className="p-3 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <img
                      src={item.cover || undefined}
                      alt=""
                      loading="lazy"
                      className="w-20 h-16 rounded object-cover bg-surface-container shrink-0"
                    />
                    <div className="min-w-0 flex flex-col gap-1">
                      <p className="font-body-sm text-body-sm font-bold text-on-surface line-clamp-2">
                        {item.judul}
                      </p>
                      <NewsStatusBadge status={item.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-caption text-caption text-on-surface-variant">
                      {item.authorNama} · {formatDate(item.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreview(item)}
                        className="h-8 px-2.5 rounded-md border border-border-strong font-caption text-caption font-bold"
                      >
                        Lihat
                      </button>
                      {isAdmin ? (
                        <Link
                          to={`/berita/${item.id}/edit`}
                          className="h-8 px-2.5 rounded-md bg-surface-container font-caption text-caption font-bold"
                        >
                          Edit
                        </Link>
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

      {preview ? (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/50 backdrop-blur-[2px]"
            onClick={() => setPreview(null)}
            aria-label="Tutup pratinjau"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Pratinjau ${preview.judul}`}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-container-lowest shadow-card-hover"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  visibility
                </span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Pratinjau berita
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <NewsStatusBadge status={preview.status} />
                <span className="font-caption text-caption text-on-surface-variant">
                  {preview.publishedAt
                    ? formatDateTime(preview.publishedAt)
                    : `Dibuat ${formatDateTime(preview.createdAt)}`}
                </span>
              </div>
              <h2 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
                {preview.judul}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {preview.ringkasan}
              </p>
              <img
                src={preview.cover || undefined}
                alt=""
                className="w-full max-h-[320px] object-cover rounded-lg"
              />
              <div
                className="font-body-md text-body-md text-on-surface leading-relaxed [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: preview.isi }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <ActionDialog
        open={Boolean(toDelete)}
        title="Hapus berita?"
        description={
          toDelete
            ? `“${toDelete.judul}” akan dihapus permanen dari website publik.`
            : undefined
        }
        confirmLabel="Hapus Berita"
        variant="danger"
        loading={deleteMutation.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteMutation.mutate(toDelete.id)
        }}
      >
        {toDelete?.status === 'TERBIT' ? (
          <button
            type="button"
            onClick={() => {
              unpublishMutation.mutate(toDelete.id)
              setToDelete(null)
            }}
            className="self-start font-caption text-caption font-bold text-secondary hover:underline"
          >
            Tarik ke draf saja tanpa menghapus
          </button>
        ) : null}
      </ActionDialog>
    </>
  )
}
