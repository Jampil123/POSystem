import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserListItem } from '@/features/users/api'
import { ResetPasswordDialog } from '@/features/users/components/ResetPasswordDialog'
import { UserFormSheet } from '@/features/users/components/UserFormSheet'
import { UserTable, type UserAction } from '@/features/users/components/UserTable'
import { useResetApprovalPin, useUpdateUser, useUsers } from '@/features/users/hooks/useUsers'
import { errorMessage } from '@/lib/errors'

// Admin only (see navItems). Adding users and passwords go through the
// admin-users Edge Function; it checks again that the caller is an active admin.
export default function UsersPage() {
  const { profile } = useAuth()
  const users = useUsers()
  const updateUser = useUpdateUser()
  const resetPin = useResetApprovalPin()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserListItem | null>(null)
  const [passwordUser, setPasswordUser] = useState<UserListItem | null>(null)
  const [confirming, setConfirming] = useState<{
    action: 'deactivate' | 'reset-pin'
    user: UserListItem
  } | null>(null)

  const currentUserId = profile?.id ?? ''
  const activeAdminCount = (users.data ?? []).filter(
    (user) => user.role === 'admin' && user.is_active,
  ).length

  function setActive(user: UserListItem, isActive: boolean) {
    updateUser.mutate(
      { userId: user.id, fullName: user.full_name, role: user.role, isActive },
      {
        onSuccess: () => {
          toast.success(
            isActive ? `${user.full_name} can log in again` : `${user.full_name} is turned off`,
          )
          setConfirming(null)
        },
        onError: (error) => {
          toast.error(errorMessage(error))
          setConfirming(null)
        },
      },
    )
  }

  function handleAction(action: UserAction, user: UserListItem) {
    if (action === 'edit') {
      setEditing(user)
      setFormOpen(true)
    }
    if (action === 'reset-password') setPasswordUser(user)
    if (action === 'reset-pin' || action === 'deactivate') setConfirming({ action, user })
    if (action === 'activate') setActive(user, true)
  }

  function confirm() {
    if (!confirming) return
    if (confirming.action === 'deactivate') {
      setActive(confirming.user, false)
      return
    }
    resetPin.mutate(confirming.user.id, {
      onSuccess: () => {
        toast.success(`Approval PIN removed. ${confirming.user.full_name} can set a new one.`)
        setConfirming(null)
      },
      onError: (error) => {
        toast.error(errorMessage(error))
        setConfirming(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Users"
        actions={
          <Button
            className="h-12"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus aria-hidden="true" />
            Add user
          </Button>
        }
      />

      {users.isPending ? (
        <ListSkeleton rows={5} />
      ) : users.isError ? (
        <ErrorState message="Could not load the users." onRetry={() => void users.refetch()} />
      ) : users.data.length === 0 ? (
        <EmptyState icon={Users} message="No users yet." />
      ) : (
        <UserTable users={users.data} currentUserId={currentUserId} onAction={handleAction} />
      )}

      <UserFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        currentUserId={currentUserId}
        activeAdminCount={activeAdminCount}
      />
      <ResetPasswordDialog user={passwordUser} onClose={() => setPasswordUser(null)} />
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          confirming?.action === 'reset-pin'
            ? `Reset the approval PIN of ${confirming.user.full_name}?`
            : `Deactivate ${confirming?.user.full_name ?? ''}?`
        }
        description={
          confirming?.action === 'reset-pin'
            ? 'Their PIN is removed. They cannot approve voids or refunds until they set a new one from their user menu.'
            : 'They are logged out on their next action and cannot log in until activated again. Their past sales are kept.'
        }
        confirmLabel={confirming?.action === 'reset-pin' ? 'Reset PIN' : 'Deactivate'}
        isPending={updateUser.isPending || resetPin.isPending}
        onConfirm={confirm}
      />
    </div>
  )
}
