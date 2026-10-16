import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<StatusTone, string> = {
  success: 'border-success/40 bg-success/10',
  warning: 'border-warning/40 bg-warning/10',
  danger: 'border-destructive/40 bg-destructive/10',
  neutral: 'border-border bg-muted',
}

const dotClasses: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  neutral: 'bg-muted-foreground',
}

// Small pill: green (in stock), amber (low), red (out/void), gray (inactive).
// The text stays dark so it is readable, and the word always says the status
// so it is never shown by color alone.
export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-foreground',
        toneClasses[tone],
      )}
    >
      <span className={cn('size-2 rounded-full', dotClasses[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}
