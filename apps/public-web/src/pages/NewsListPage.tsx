import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { formatDate } from '../lib/format'
import { fetchNewsList } from '../lib/store'
import { usePageTitle } from '../lib/usePageTitle'
import { VILLAGE } from '../lib/village'

export function NewsListPage() {
  usePageTitle('Kabar & Berita')
  const [query, setQuery] = useState('')

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNewsList,
  })

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return news
    return news.filter(
      (item) =>
        item.judul.toLowerCase().includes(needle) ||
        item.ringkasan.toLowerCase().includes(needle),
    )
  }, [news, query])

  const [featured, ...rest] = filtered

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-dark text-on-primary py-space-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop relative z-10 flex flex-col gap-space-sm">
          <nav className="flex items-center gap-space-xs font-caption text-caption text-on-primary/75">
            <Link to="/" className="hover:text-on-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              Beranda
            </Link>
            <span className="text-on-primary/40">/</span>
            <span className="text-primary-fixed font-bold">Kabar &amp; Berita Kota</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
            <div className="max-w-3xl">
              <h1 className="font-heading text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tight font-bold">
                Warta &amp; Berita {VILLAGE.nama}
              </h1>
              <p className="font-body-md text-body-md text-on-primary/85 mt-space-xs leading-relaxed">
                Informasi resmi seputar pembangunan dan pemeliharaan jalan kota,
                agenda layanan publik, serta kegiatan masyarakat {VILLAGE.namaPendek}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-margin lg:px-margin-desktop -mt-6 relative z-20 pb-space-xl">
        <div className="bg-surface-container-lowest rounded-xl shadow-card p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-lg">
          <div className="w-full sm:max-w-xl relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <label htmlFor="news-search" className="sr-only">
              Cari berita kota
            </label>
            <input
              id="news-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full pl-11 pr-10 py-2.5 min-h-[44px] bg-surface text-on-surface rounded-md font-body-sm text-body-sm outline-none placeholder:text-outline focus:bg-surface-container-lowest border border-border-subtle focus:border-primary transition-colors"
              placeholder="Cari judul atau topik berita kota…"
              type="search"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                aria-label="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            ) : null}
          </div>

          <span className="font-caption text-caption text-on-surface-variant shrink-0">
            {isLoading ? 'Memuat berita…' : `${filtered.length} berita ditampilkan`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-space-lg">
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-96 rounded-xl" />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="newspaper"
            title="Berita Tidak Ditemukan"
            description="Coba kata kunci lain atau hapus pencarian."
            actionLabel="Tampilkan Semua"
            onAction={() => {
              setQuery('')
            }}
          />
        ) : (
          <div className="flex flex-col gap-space-lg">
            <Link
              to={`/berita/${featured.slug}`}
              className="group grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden bg-surface-container-lowest shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="relative min-h-[260px] lg:min-h-[360px] overflow-hidden">
                <img
                  src={featured.cover || undefined}
                  alt={featured.judul}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-on-primary font-caption text-caption font-semibold shadow-card">
                  Sorotan
                </span>
              </div>
              <div className="p-space-lg lg:p-space-xl flex flex-col justify-center gap-space-sm">
                <div className="flex flex-wrap items-center gap-2 font-caption text-caption">
                  <span className="text-on-surface-variant">
                    {formatDate(featured.publishedAt)}
                  </span>
                </div>
                <h2 className="font-heading text-[24px] sm:text-[30px] leading-tight text-on-surface font-bold group-hover:text-primary transition-colors">
                  {featured.judul}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed line-clamp-3">
                  {featured.ringkasan}
                </p>
                <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold mt-space-xs">
                  Baca selengkapnya
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>

            {rest.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-space-sm pt-space-sm">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Berita Lainnya
                  </h3>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Menampilkan {filtered.length} berita
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
                  {rest.map((item) => (
                    <Link
                      key={item.id}
                      to={`/berita/${item.slug}`}
                      className="group flex flex-col rounded-xl overflow-hidden bg-surface-container-lowest shadow-card hover:shadow-card-hover transition-shadow"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                        <img
                          src={item.cover || undefined}
                          alt={item.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-space-md flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2 font-caption text-caption">
                          <span className="text-on-surface-variant">
                            {formatDate(item.publishedAt)}
                          </span>
                        </div>
                        <h4 className="font-title text-title text-on-surface font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.judul}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">
                          {item.ringkasan}
                        </p>
                        <span className="mt-auto pt-space-sm inline-flex items-center gap-1 font-caption text-caption text-primary font-bold">
                          Baca selengkapnya
                          <span className="material-symbols-outlined text-[16px]">
                            arrow_forward
                          </span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
