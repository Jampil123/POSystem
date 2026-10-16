import { KeyRound, Pencil, Power, PowerOff, RotateCcw } from 'lucide-react'
import { checkUserChange } from '@functions/_shared/userRules.ts'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserListItem } from '@/features/users/api'
import { cn } from '@/lib/utils'

export type UserAction = 'edit' | 'reset-password' | 'reset-pin' | 'deactivate' | 'activate'

type UserTableProps = {
  users: UserListItem[]
  currentUserId: string
  onAction: (action: UserAction, user: UserListItem) => void
}

const roleLabels = { admin: 'Admin', cashier: 'Cashier' } as const

// Name, username, role, status, and actions (UI guide 6.9).
// Table on tablets and desktops; one card per user on phones.
export function UserTable({ users, currentUserId, onAction }: UserTableProps) {
  const activeAdminCount = users.filter((user) => user.role === 'admin' && user.is_active).length

  function deactivateBlockedReason(user: UserListItem) {
    return checkUserChange({
      actorId: currentUserId,
      target: user,
      change: { isActive: false },
      activeAdminCount,
    })
  }

  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={cn(!user.is_active && 'text-muted-foreground')}>
                <TableCell className="px-4 font-medium whitespace-normal">
                  <UserName user={user} isYou={user.id === currentUserId} />
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{roleLabels[user.role]}</TableCell>
                <TableCell>
                  <ActiveBadge isActive={user.is_active} />
                </TableCell>
                <TableCell className="px-4">
                  <UserActions
                    user={user}
                    blockedReason={deactivateBlockedReason(user)}
                    onAction={onAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            className={cn(
              'flex flex-col gap-3 rounded-lg border bg-card p-4',
              !user.is_active && 'text-muted-foreground',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  <UserName user={user} isYou={user.id === currentUserId} />
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.username} · {roleLabels[user.role]}
                </p>
              </div>
              <ActiveBadge isActive={user.is_active} />
            </div>
            <UserActions
              user={user}
              blockedReason={deactivateBlockedReason(user)}
              onAction={onAction}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

function UserName({ user, isYou }: { user: UserListItem; isYou: boolean }) {
  return (
    <>
      {user.full_name}
      {isYou && <span className="ml-2 text-sm font-normal text-muted-foreground">(you)</span>}
    </>
  )
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <StatusBadge tone="success">Active</StatusBadge>
  ) : (
    <StatusBadge tone="neutral">Inactive</StatusBadge>
  )
}

function UserActions({
  user,
  blockedReason,
  onAction,
}: {
  user: UserListItem
  /** Why this user cannot be deactivated (own account or last admin), or null. */
  blockedReason: string | null
  onAction: (action: UserAction, user: UserListItem) => void
}) {
  const reasonId = `deactivate-note-${user.id}`

  return (
    <div className="flex flex-col gap-1 md:items-end">
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button
          variant="outline"
          className="h-12"
          aria-label={`Edit ${user.full_name}`}
          onClick={() => onAction('edit', user)}
        >
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button
          variant="outline"
          className="h-12"
          aria-label={`Reset the password of ${user.full_name}`}
          onClick={() => onAction('reset-password', user)}
        >
          <KeyRound aria-hidden="true" />
          Password
        </Button>
        {user.role === 'admin' && (
          <Button
            variant="outline"
            className="h-12"
            aria-label={`Reset the approval PIN of ${user.full_name}`}
            onClick={() => onAction('reset-pin', user)}
          >
            <RotateCcw aria-hidden="true" />
            PIN
          </Button>
        )}
        {user.is_active ? (
          <Button
            variant="outline"
            className="h-12 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Deactivate ${user.full_name}`}
            aria-describedby={blockedReason ? reasonId : undefined}
            disabled={blockedReason !== null}
            onClick={() => onAction('deactivate', user)}
          >
            <PowerOff aria-hidden="true" />
            Deactivate
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-12"
            aria-label={`Activate ${user.full_name}`}
            onClick={() => onAction('activate', user)}
          >
            <Power aria-hidden="true" />
            Activate
          </Button>
        )}
      </div>
      {blockedReason && (
        <p id={reasonId} className="text-xs text-muted-foreground">
          {blockedReason}
        </p>
      )}
    </div>
  )
}
