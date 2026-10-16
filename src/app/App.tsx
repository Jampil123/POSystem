import { RouterProvider } from 'react-router'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'
import { OfflineScreen } from '@/components/common/OfflineScreen'
import { UpdatePrompt } from '@/components/common/UpdatePrompt'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'

export default function App() {
  return (
    <AppErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
        <UpdatePrompt />
        <OfflineScreen />
      </Providers>
    </AppErrorBoundary>
  )
}
