import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ActionDialog } from '../components/ActionDialog'
import { ErrorState } from '../components/EmptyState'
import { RichTextEditor } from '../components/RichTextEditor'
import { Skeleton } from '../components/Skeleton'
import { NewsStatusBadge } from '../components/StatusBadge'
import { useToast } from '../components/Toast'
import { useAuth } from '../lib/auth'
import { compressPhoto } from '../lib/image'
import { cn, formatDateTime } from '../lib/format'
import {
  checkSlug,
  deleteNews,
  fetchNewsById,
  saveNews,
  slugify,
  summarize,
  uniqueSlug,
} from '../lib/store'
import { type NewsStatus } from '../lib/types'
import { usePageTitle } from '../lib/usePageTitle'

const PUBLIC_SITE = 'http://localhost:5173'

interface FormState {
  judul: string
  slug: string
  ringkasan: string
  isi: string
  cover: string
}

const EMPTY: FormState = {
  judul: '',
  slug: '',
  ringkasan: '',
  isi: '',
  cover: '',
}

export function NewsFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const newsId = Number(id)
  const { admin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-news-item', newsId],
    queryFn: () => fetchNewsById(newsId),
    enabled: editing,
  })

  usePageTitle(editing ? 'Edit Berita' : 'Tulis Berita')

  const [form, setForm] = useState<FormState>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(editing)
  const [loaded, setLoaded] = useState(!editing)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing || loaded || !query.data) return
    const item = query.data
    setForm({
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan,
      isi: item.isi,
      cover: item.cover,
    })
    setLoaded(true)
  }, [editing, loaded, query.data])

  const original = query.data
  const status: NewsStatus = original?.status ?? 'DRAFT'

  const slugValue = form.slug.trim()
  const slugCheck = useQuery({
    queryKey: ['admin-news-slug', slugValue, editing ? newsId : null],
    queryFn: () => checkSlug(slugValue, editing ? newsId : undefined),
    enabled: slugValue.length > 0,
    staleTime: 30_000,
  })

  const slugError =
    slugValue.length > 0 && slugCheck.data
      ? 'Slug sudah dipakai berita lain.'
      : null

  const contentEmpty =
    form.isi
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length === 0
  const canPublish =
    form.judul.trim().length > 0 && !contentEmpty && !slugError && form.cover.length > 0

  const saveMutation = useMutation({
    mutationFn: (nextStatus: NewsStatus) =>
      saveNews(
        {
          judul: form.judul.trim(),
          slug: form.slug.trim(),
          ringkasan: form.ringkasan.trim() || summarize(form.isi),
          isi: form.isi,
          cover: form.cover,
        },
        admin!,
        nextStatus,
        editing ? newsId : undefined,
      ),
    onSuccess: (_item, nextStatus) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-news-item', newsId] })
      showToast(
        nextStatus === 'TERBIT'
          ? 'Berita diterbitkan.'
          : 'Berita disimpan sebagai draf.',
        nextStatus === 'TERBIT' ? 'success' : 'info',
      )
      navigate('/berita')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteNews(newsId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] })
      showToast('Berita dihapus.', 'info')
      navigate('/berita')
    },
  })

  if (editing && query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    )
  }

  if (editing && query.isError) {
    return <ErrorState message="Berita tidak dapat dimuat." onRetry={() => void query.refetch()} />
  }

  if (editing && !query.data) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-container-lowest py-16 text-center">
        <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Berita tidak ditemukan
        </p>
        <Link to="/berita" className="mt-2 inline-flex font-label-md text-label-md text-primary font-bold">
          Kembali ke Berita
        </Link>
      </div>
    )
  }

  const dirty =
    form.judul !== (original?.judul ?? '') ||
    form.slug !== (original?.slug ?? '') ||
    form.ringkasan !== (original?.ringkasan ?? '') ||
    form.isi !== (original?.isi ?? '') ||
    form.cover !== (original?.cover ?? '')

  const update = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const handleTitle = (value: string) => {
    update({
      judul: value,
      ...(slugTouched ? {} : { slug: slugify(value) }),
    })
  }

  const normalizeSlug = async () => {
    const base = slugify(form.slug)
    if (!base) return
    const unique = await uniqueSlug(base, editing ? newsId : undefined)
    if (unique !== form.slug) update({ slug: unique })
  }

  const handleCover = async (file: File | undefined) => {
    if (!file) return
    setCoverError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverError('Format sampul harus JPG, PNG, atau WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setCoverError('Ukuran sampul maksimal 2 MB.')
      return
    }
    setCoverBusy(true)
    try {
      update({ cover: await compressPhoto(file) })
    } catch {
      setCoverError('Sampul gagal diproses. Coba berkas lain.')
    } finally {
      setCoverBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleCancel = () => {
    if (dirty) setConfirmCancel(true)
    else navigate('/berita')
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
            <Link to="/berita" className="hover:text-primary">
              Berita
            </Link>
            <span>/</span>
            <span>{editing ? 'Edit' : 'Tulis Berita'}</span>
          </nav>
          <h1 className="font-heading text-[26px] leading-tight font-bold text-on-surface">
            {editing ? 'Edit Berita' : 'Tulis Berita Baru'}
          </h1>
        </div>
        {editing && original ? (
          <div className="flex items-center gap-2">
            <NewsStatusBadge status={original.status} />
            {original.status === 'TERBIT' && original.publishedAt ? (
              <a
                href={`${PUBLIC_SITE}/berita/${original.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-border-strong font-caption text-caption font-bold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Lihat di Website
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-container-lowest p-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Judul <span className="text-tertiary">*</span>
            </span>
            <input
              value={form.judul}
              onChange={(event) => handleTitle(event.target.value)}
              maxLength={200}
              placeholder="Judul berita yang jelas dan informatif"
              className="h-11 rounded-md border border-border-strong bg-surface-container-lowest px-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <span className="font-caption text-caption text-on-surface-variant text-right">
              {form.judul.length} / 200
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Slug <span className="text-tertiary">*</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-caption text-caption text-on-surface-variant">/berita/</span>
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  update({ slug: event.target.value })
                }}
                onBlur={() => void normalizeSlug()}
                className={cn(
                  'h-10 flex-1 rounded-md border bg-surface-container-lowest px-3 font-ticket text-ticket-code outline-none focus:ring-2 focus:ring-primary/15',
                  slugError
                    ? 'border-status-rejected focus:border-status-rejected'
                    : 'border-border-strong focus:border-primary',
                )}
              />
            </div>
            {slugError ? (
              <span className="font-caption text-caption font-semibold text-status-rejected">
                {slugError}
              </span>
            ) : (
              <span className="font-caption text-caption text-on-surface-variant">
                Dibuat otomatis dari judul. Bisa diubah manual.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Ringkasan
            </span>
            <textarea
              value={form.ringkasan}
              onChange={(event) => update({ ringkasan: event.target.value })}
              rows={2}
              placeholder="Ringkasan singkat untuk kartu berita. Kosongkan untuk dibuat otomatis."
              className="rounded-md border border-border-strong bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Isi berita <span className="text-tertiary">*</span>
            </span>
            <RichTextEditor value={form.isi} onChange={(isi) => update({ isi })} />
            {contentEmpty ? (
              <span className="font-caption text-caption text-on-surface-variant">
                Isi berita belum diisi.
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
            <h2 className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider">
              Gambar sampul <span className="text-tertiary">*</span>
            </h2>
            {form.cover ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={form.cover} alt="Sampul berita" className="w-full aspect-video object-cover" />
                <button
                  type="button"
                  onClick={() => update({ cover: '' })}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-on-surface/80 text-on-primary flex items-center justify-center hover:bg-status-rejected"
                  aria-label="Hapus sampul"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={coverBusy}
                className="aspect-video rounded-lg border-2 border-dashed border-border-strong bg-surface-container-low hover:border-primary flex flex-col items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[30px] text-primary">
                  {coverBusy ? 'hourglass_top' : 'add_photo_alternate'}
                </span>
                <span className="font-caption text-caption font-semibold text-on-surface">
                  {coverBusy ? 'Memproses…' : 'Unggah sampul'}
                </span>
                <span className="font-caption text-[11px] text-on-surface-variant">
                  JPG, PNG, WebP · maks 2 MB
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void handleCover(event.target.files?.[0])}
            />
            {form.cover ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-left font-caption text-caption font-bold text-primary hover:underline"
              >
                Ganti sampul
              </button>
            ) : null}
            {coverError ? (
              <p className="font-caption text-caption font-semibold text-status-rejected">
                {coverError}
              </p>
            ) : null}
          </section>

          {editing && original ? (
            <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-3">
              <dl className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-caption text-caption text-on-surface-variant">Dibuat</dt>
                  <dd className="font-caption text-caption text-on-surface">
                    {formatDateTime(original.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-caption text-caption text-on-surface-variant">Penulis</dt>
                  <dd className="font-caption text-caption text-on-surface">
                    {original.authorNama}
                  </dd>
                </div>
                {original.publishedAt ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="font-caption text-caption text-on-surface-variant">Terbit</dt>
                    <dd className="font-caption text-caption text-on-surface">
                      {formatDateTime(original.publishedAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section className="rounded-lg border border-border-subtle bg-surface-container-lowest p-4 flex flex-col gap-2">
            {saveMutation.isError ? (
              <p className="font-caption text-caption font-semibold text-status-rejected">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : 'Gagal menyimpan berita.'}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => saveMutation.mutate('TERBIT')}
              disabled={!canPublish || saveMutation.isPending}
              className="h-10 rounded-md bg-primary font-label-md text-label-md font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
            >
              {saveMutation.isPending ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">public</span>
              )}
              {editing && status === 'TERBIT' ? 'Simpan & Perbarui' : 'Terbitkan'}
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate('DRAFT')}
              disabled={form.judul.trim().length === 0 || saveMutation.isPending || Boolean(slugError)}
              className="h-10 rounded-md border border-border-strong font-label-md text-label-md font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {editing && status === 'TERBIT' ? 'Tarik ke Draf' : 'Simpan Draf'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="h-9 rounded-md font-caption text-caption font-bold text-secondary hover:bg-secondary-soft inline-flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Pratinjau
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-9 rounded-md font-caption text-caption font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Batal
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-1 h-9 rounded-md font-caption text-caption font-bold text-status-rejected hover:bg-status-rejected-soft inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Hapus Berita
              </button>
            ) : null}
          </section>
        </div>
      </div>

      <ActionDialog
        open={previewOpen}
        title="Pratinjau berita"
        confirmLabel="Tutup"
        cancelLabel="Tutup"
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => setPreviewOpen(false)}
      >
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {form.cover ? (
            <img src={form.cover} alt="" className="w-full max-h-56 object-cover rounded-lg" />
          ) : null}
          <h3 className="font-heading text-[22px] leading-tight font-bold text-on-surface">
            {form.judul || 'Tanpa judul'}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {form.ringkasan || summarize(form.isi)}
          </p>
          <div
            className="font-body-sm text-body-sm text-on-surface leading-relaxed [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: form.isi }}
          />
        </div>
      </ActionDialog>

      <ActionDialog
        open={confirmCancel}
        title="Batalkan perubahan?"
        description="Perubahan yang belum disimpan akan hilang."
        confirmLabel="Ya, batalkan"
        variant="danger"
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false)
          navigate('/berita')
        }}
      />

      <ActionDialog
        open={confirmDelete}
        title="Hapus berita?"
        description={
          original
            ? `“${original.judul}” akan dihapus permanen dari website publik.`
            : undefined
        }
        confirmLabel="Hapus Berita"
        variant="danger"
        loading={deleteMutation.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  )
}
