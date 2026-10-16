import { useMutation } from '@tanstack/react-query'
import { setApprovalPin } from '@/features/auth/api'

export function useSetApprovalPin() {
  return useMutation({ mutationFn: (pin: string) => setApprovalPin(pin) })
}
