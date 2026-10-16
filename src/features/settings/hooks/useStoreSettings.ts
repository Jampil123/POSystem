import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoreSettings, updateStoreSettings } from '@/features/settings/api'
import type { SettingsValues } from '@/features/settings/schema'

export const storeSettingsKey = ['store-settings'] as const

export function useStoreSettings() {
  return useQuery({ queryKey: storeSettingsKey, queryFn: getStoreSettings })
}

// Saving puts the new settings straight into the cache, so the POS, receipts,
// and product form use them right away.
export function useSaveStoreSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SettingsValues) => updateStoreSettings(values),
    onSuccess: (saved) => queryClient.setQueryData(storeSettingsKey, saved),
  })
}
