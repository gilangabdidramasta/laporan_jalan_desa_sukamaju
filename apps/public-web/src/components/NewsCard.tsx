import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format'
import type { NewsItem } from '../lib/types'

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  if (featured) {
    return (
      <Link
        to={`/berita/${item.slug}`}
        className="group relative flex flex-col justify-end min-h-[380px] rounded-lg overflow-hidden bg-surface-dark shadow-card"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${item.cover}')` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/60 to-transparent" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-space-xs">
          <span className="text-on-primary/75 font-caption text-caption mb-1 block">
            {formatDate(item.publishedAt)}
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-primary font-bold group-hover:text-primary-soft transition-colors leading-tight">
            {item.judul}
          </h3>
          <p className="font-body-sm text-body-sm text-on-primary/80 line-clamp-2 leading-relaxed">
            {item.ringkasan}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/berita/${item.slug}`}
      className="group flex gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-card hover:shadow-card-hover transition-shadow duration-200"
    >
      <img
        src={item.cover || undefined}
        alt={item.judul}
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-md object-cover shrink-0"
        loading="lazy"
      />
      <div className="flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <span className="text-on-surface-variant font-caption text-caption mb-1 block">
            {formatDate(item.publishedAt)}
          </span>
          <h4 className="font-title text-title text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {item.judul}
          </h4>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
          {item.ringkasan}
        </p>
      </div>
    </Link>
  )
}
