import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { formatDateLong } from '../lib/format'
import { fetchNewsBySlug, fetchNewsList } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { VILLAGE } from '../lib/village'

export function NewsDetailPage() {
  const { slug = '' } = useParams()
  const [copied, setCopied] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => fetchNewsBySlug(slug),
  })

  const { data: allNews = [] } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNewsList,
  })

  usePageTitle(item?.judul ?? 'Berita')

  const related = allNews.filter((entry) => entry.slug !== slug).slice(0, 3)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-md">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-16">
        <EmptyState
          icon="newspaper"
          title="Berita Tidak Ditemukan"
          description="Tautan mungkin sudah tidak berlaku atau berita telah ditarik dari publikasi."
          actionLabel="Lihat Semua Berita"
          actionTo="/berita"
        />
      </div>
    )
  }

  const paragraphs = item.isi.split(/\n{2,}/).filter(Boolean)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <article className="w-full max-w-3xl mx-auto px-margin lg:px-margin-desktop pt-space-xl pb-space-lg">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-space-xs font-caption text-caption text-on-surface-variant mb-space-md"
        >
          <Link to="/" className="hover:text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">home</span>
            Beranda
          </Link>
          <span className="text-on-surface-variant/40">/</span>
          <Link to="/berita" className="hover:text-primary">
            Berita
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-2 font-caption text-caption">
          <span className="text-on-surface-variant">{formatDateLong(item.publishedAt)}</span>
          <span className="text-on-surface-variant/40">•</span>
          <span className="text-on-surface-variant">Pemerintah {VILLAGE.nama}</span>
        </div>

        <h1 className="font-heading text-[28px] sm:text-[38px] leading-tight text-on-surface font-bold mt-space-sm">
          {item.judul}
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mt-space-md">
          {item.ringkasan}
        </p>

        <figure className="mt-space-lg">
          <img
            src={item.cover || undefined}
            alt={item.judul}
            className="w-full aspect-[16/9] object-cover rounded-xl shadow-card"
          />
          <figcaption className="font-caption text-caption text-on-surface-variant mt-2">
            Dokumentasi kegiatan Kota Pekanbaru. Foto: Humas Pemerintah Kota.
          </figcaption>
        </figure>

        <div className="mt-space-lg flex flex-col gap-space-md">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="font-body-md text-body-md text-on-surface leading-[1.85]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-space-lg pt-space-md border-t border-border-subtle flex flex-wrap items-center justify-between gap-space-sm">
          <Link
            to="/berita"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Semua berita
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              {copied ? 'check' : 'link'}
            </span>
            {copied ? 'Tautan tersalin' : 'Salin tautan berita'}
          </button>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="w-full bg-surface-container-low py-space-xl">
          <div className="max-w-5xl mx-auto px-margin lg:px-margin-desktop">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">
              Berita Lainnya
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {related.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/berita/${entry.slug}`}
                  className="group bg-surface-container-lowest rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={entry.cover || undefined}
                      alt={entry.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-space-sm flex flex-col gap-1">
                    <h3 className="font-body-sm text-body-sm text-on-surface font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {entry.judul}
                    </h3>
                    <span className="font-caption text-[11px] text-on-surface-variant">
                      {formatDateLong(entry.publishedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
