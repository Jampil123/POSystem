import { ChevronDown, CircleUserRound, LogOut } from 'lucide-react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { navItems } from '@/components/layout/navItems'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/hooks/useAuth'

const roleLabels = { admin: 'Admin', cashier: 'Cashier' } as const

export function TopBar() {
  const { pathname } = useLocation()
  const { profile, logOut } = useAuth()
  const current = navItems.find((item) => pathname.startsWith(item.path))

  async function handleLogOut() {
    try {
      await logOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log out. Please try again.')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <img src="/icons/logo.svg" alt="" className="size-8 md:hidden" />
        <span className="truncate text-lg font-semibold">{current?.label ?? 'Kuya Tata POS'}</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {/* Placeholder: real shift status comes in Phase 4 */}
        <span className="hidden text-muted-foreground sm:inline">No open shift</span>

        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 gap-2 px-2"
                aria-label={`Account menu for ${profile.full_name}`}
              >
                <CircleUserRound className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className="hidden max-w-40 truncate md:inline">{profile.full_name}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuLabel className="flex flex-col">
                <span>{profile.full_name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {roleLabels[profile.role]}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-12" onSelect={() => void handleLogOut()}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
