import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logIn } from '@/features/auth/api'
import { profileQueryKey } from '@/features/auth/hooks/useAuth'
import type { LoginValues } from '@/features/auth/schema'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ username, password }: LoginValues) => logIn(username, password),
    // The profile was just loaded, so save it instead of loading it again.
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(profile.id), profile),
  })
}
