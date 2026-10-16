import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  message: string
  /** Optional button, e.g. "Add product". */
  action?: ReactNode
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card px-4 py-10 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
