import { cn } from '../lib/format'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-container-high/70',
        className,
      )}
    />
  )
}

export function ReportCardSkeleton() {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-space-md flex flex-col gap-space-sm">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-space-sm">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  )
}
