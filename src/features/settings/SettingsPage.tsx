import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { SettingsForm } from '@/features/settings/components/SettingsForm'
import { useStoreSettings } from '@/features/settings/hooks/useStoreSettings'

// Admin only (see navItems and the store_settings security rules).
export default function SettingsPage() {
  const settings = useStoreSettings()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Settings" />
      {settings.isPending ? (
        <ListSkeleton rows={6} />
      ) : settings.isError ? (
        <ErrorState
          message="Could not load the settings."
          onRetry={() => void settings.refetch()}
        />
      ) : (
        <SettingsForm settings={settings.data} />
      )}
    </div>
  )
}
