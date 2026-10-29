import { cn } from '../lib/format'

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [20, 50, 100],
}: {
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  perPageOptions?: number[]
}) {
  const pages = buildPages(page, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm px-4 py-3 border-t border-border-subtle">
      <div className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
        <span>
          {total === 0
            ? 'Tidak ada data'
            : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} dari ${total}`}
        </span>
        {onPerPageChange ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Baris per halaman</span>
            <select
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              className="rounded border border-border-strong bg-surface-container-lowest px-2 py-1 font-body-sm text-body-sm"
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / hal
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded border border-border-subtle flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman sebelumnya"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {pages.map((item, index) =>
          item === 'dots' ? (
            <span
              key={`dots-${index}`}
              className="w-8 h-8 flex items-center justify-center text-on-surface-variant"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'min-w-8 h-8 px-2 rounded border font-body-sm text-body-sm font-semibold transition-colors',
                item === page
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-border-subtle text-on-surface hover:bg-surface-container',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded border border-border-subtle flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman berikutnya"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

function buildPages(current: number, total: number): Array<number | 'dots'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const pages: Array<number | 'dots'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('dots')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push('dots')
  pages.push(total)
  return pages
}
