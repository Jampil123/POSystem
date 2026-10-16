import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

// Phone (below md): top bar + bottom navigation.
// Tablet and laptop (md to xl): sidebar collapsed to icons.
// Desktop (xl and up): full 240px sidebar.
// Padding includes the safe areas around the iPhone notch and home bar.
export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* Bottom padding keeps content above the phone bottom bar */}
        <main className="flex-1 pt-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:pt-6 short:pt-3! md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pl-6">
          {/* Shown while a page is being loaded for the first time */}
          <Suspense fallback={<ListSkeleton rows={6} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
