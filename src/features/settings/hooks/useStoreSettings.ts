import { useQuery } from '@tanstack/react-query'
import { getStoreSettings } from '@/features/settings/api'

export const storeSettingsKey = ['store-settings'] as const

export function useStoreSettings() {
  return useQuery({ queryKey: storeSettingsKey, queryFn: getStoreSettings, staleTime: 5 * 60_000 })
}
