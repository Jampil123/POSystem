import { Outlet } from 'react-router'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

// Phone (below md): top bar + bottom navigation.
// Tablet and laptop (md to xl): sidebar collapsed to icons.
// Desktop (xl and up): full 240px sidebar.
export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* Bottom padding keeps content above the phone bottom bar */}
        <main className="flex-1 p-4 pb-24 md:p-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
