import { CircleUserRound } from 'lucide-react'
import { useLocation } from 'react-router'
import { navItems } from '@/components/layout/navItems'

export function TopBar() {
  const { pathname } = useLocation()
  const current = navItems.find((item) => pathname.startsWith(item.path))

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <img src="/icons/logo.svg" alt="" className="size-8 md:hidden" />
        <span className="truncate text-lg font-semibold">{current?.label ?? 'Kuya Tata POS'}</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {/* Placeholder: real shift status comes in Phase 4 */}
        <span className="hidden text-muted-foreground sm:inline">No open shift</span>
        {/* Placeholder: logged-in user and logout come in Phase 2 */}
        <span className="flex items-center gap-2">
          <CircleUserRound className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="hidden md:inline">Guest</span>
        </span>
      </div>
    </header>
  )
}
