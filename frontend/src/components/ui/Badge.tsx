import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
      positive: 'bg-[var(--color-positive-bg)] text-[var(--color-positive)]',
      negative: 'bg-[var(--color-negative-bg)] text-[var(--color-negative)]',
      warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
      accent: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function statusToBadgeVariant(status?: string): NonNullable<BadgeProps['variant']> {
  const s = (status || '').toLowerCase()
  if (['success', 'verified', 'active', 'completed', 'approved'].includes(s)) return 'positive'
  if (['failed', 'declined', 'rejected', 'frozen', 'reported'].includes(s)) return 'negative'
  if (['pending', 'processing', 'submitted'].includes(s)) return 'warning'
  return 'neutral'
}
