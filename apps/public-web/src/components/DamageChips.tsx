import { cn } from '../lib/format'
import { DAMAGE_LABEL, type DamageType } from '../lib/types'

export function DamageChips({
  types,
  size = 'md',
  className,
}: {
  types: DamageType[]
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {types.map((type) => (
        <span
          key={type}
          className={cn(
            'rounded-full bg-primary-soft text-primary font-semibold whitespace-nowrap',
            size === 'sm'
              ? 'px-2 py-0.5 text-[11px] leading-4'
              : 'px-3 py-1 text-caption',
          )}
        >
          {DAMAGE_LABEL[type]}
        </span>
      ))}
    </div>
  )
}
