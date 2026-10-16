import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  listUsers,
  resetApprovalPin,
  resetPassword,
  updateUser,
} from '@/features/users/api'

export const userKeys = { all: ['users'] as const }

export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: listUsers })
}

// After a change, reload the user list, the logged-in profile (in case the
// admin edited their own name), and the cashier filter on Transactions.
function useRefreshUsers() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [userKeys.all, ['profile'], ['transactions', 'cashiers']].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useCreateUser() {
  const refresh = useRefreshUsers()
  return useMutation({ mutationFn: createUser, onSuccess: refresh })
}

export function useUpdateUser() {
  const refresh = useRefreshUsers()
  return useMutation({
    mutationFn: ({ userId, ...values }: Parameters<typeof updateUser>[1] & { userId: string }) =>
      updateUser(userId, values),
    onSuccess: refresh,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      resetPassword(userId, password),
  })
}

export function useResetApprovalPin() {
  return useMutation({ mutationFn: (userId: string) => resetApprovalPin(userId) })
}
