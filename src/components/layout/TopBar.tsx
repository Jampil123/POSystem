import { lazy, Suspense, useState } from 'react'
import { ChevronDown, CircleUserRound, KeyRound, LogOut } from 'lucide-react'
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
import { ShiftStatus } from '@/features/shifts/components/ShiftStatus'

// Only admins use this dialog, so it is loaded the first time it is opened.
const SetApprovalPinDialog = lazy(() =>
  import('@/features/auth/components/SetApprovalPinDialog').then((module) => ({
    default: module.SetApprovalPinDialog,
  })),
)

const roleLabels = { admin: 'Admin', cashier: 'Cashier' } as const

export function TopBar() {
  const { pathname } = useLocation()
  const { profile, logOut } = useAuth()
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pinDialogUsed, setPinDialogUsed] = useState(false)
  const current = navItems.find((item) => pathname.startsWith(item.path))

  async function handleLogOut() {
    try {
      await logOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log out. Please try again.')
    }
  }

  return (
    // Slimmer on phones in landscape to save vertical space (UI guide 5).
    // The top padding keeps it below the iPhone notch when installed on the home screen.
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-3 border-b border-border bg-card pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] short:h-[calc(3rem+env(safe-area-inset-top))]! md:h-[calc(4rem+env(safe-area-inset-top))] md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-6">
      <div className="flex min-w-0 items-center gap-2">
        <img src="/icons/logo.svg" alt="" className="size-8 md:hidden" />
        <span className="truncate text-lg font-semibold">{current?.label ?? 'Kuya Tata POS'}</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="hidden sm:inline">
          <ShiftStatus />
        </span>

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
              {profile.role === 'admin' && (
                <DropdownMenuItem
                  className="min-h-12"
                  onSelect={() => {
                    setPinDialogUsed(true)
                    setPinDialogOpen(true)
                  }}
                >
                  <KeyRound aria-hidden="true" />
                  Set approval PIN
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="min-h-12" onSelect={() => void handleLogOut()}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {pinDialogUsed && (
        <Suspense fallback={null}>
          <SetApprovalPinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />
        </Suspense>
      )}
    </header>
  )
}
