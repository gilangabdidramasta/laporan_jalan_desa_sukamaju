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
    <span className={cn('flex flex-wrap gap-1', className)}>
      {types.map((type) => (
        <span
          key={type}
          className={cn(
            'inline-flex items-center rounded-md bg-secondary-soft text-secondary font-caption font-semibold whitespace-nowrap',
            size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5',
          )}
        >
          {DAMAGE_LABEL[type]}
        </span>
      ))}
    </span>
  )
}
