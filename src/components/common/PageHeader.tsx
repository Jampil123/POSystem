import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  /** Optional buttons shown on the right, e.g. the yellow "Add product" button. */
  actions?: ReactNode
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {actions}
    </div>
  )
}
