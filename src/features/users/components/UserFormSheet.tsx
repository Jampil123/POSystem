import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { checkUserChange } from '@functions/_shared/userRules.ts'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { UserListItem } from '@/features/users/api'
import { useCreateUser, useUpdateUser } from '@/features/users/hooks/useUsers'
import {
  editUserSchema,
  newUserSchema,
  type EditUserValues,
  type NewUserValues,
} from '@/features/users/schema'
import { errorMessage } from '@/lib/errors'

type UserFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null to add a new user. */
  user: UserListItem | null
  currentUserId: string
  activeAdminCount: number
}

// Side panel on tablets and desktops; full screen on phones.
export function UserFormSheet({
  open,
  onOpenChange,
  user,
  currentUserId,
  activeAdminCount,
}: UserFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">{user ? 'Edit user' : 'Add user'}</SheetTitle>
          <SheetDescription>
            {user
              ? `Username: ${user.username}`
              : 'The user logs in with this username and password.'}
          </SheetDescription>
        </SheetHeader>
        {user ? (
          <EditUserForm
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            activeAdminCount={activeAdminCount}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <NewUserForm onDone={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <FormControl>
        <SelectTrigger className="w-full data-[size=default]:h-12">
          <SelectValue placeholder="Choose a role" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="cashier">Cashier: POS, own transactions, and shifts</SelectItem>
        <SelectItem value="admin">Admin: everything</SelectItem>
      </SelectContent>
    </Select>
  )
}

function FormButtons({
  isPending,
  label,
  onCancel,
}: {
  isPending: boolean
  label: string
  onCancel: () => void
}) {
  return (
    <div className="flex gap-2 border-t pt-4">
      <Button type="button" variant="outline" className="h-12 flex-1" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" className="h-12 flex-1" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {label}
      </Button>
    </div>
  )
}

function NewUserForm({ onDone }: { onDone: () => void }) {
  const createUser = useCreateUser()
  const form = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      full_name: '',
      username: '',
      password: '',
      confirm_password: '',
      role: 'cashier',
    },
  })

  function handleSubmit(values: NewUserValues) {
    createUser.mutate(
      {
        fullName: values.full_name,
        username: values.username,
        password: values.password,
        role: values.role,
      },
      {
        onSuccess: () => {
          toast.success(`User ${values.username} added`)
          onDone()
        },
        onError: (error) => {
          const message = errorMessage(error)
          if (message.includes('username'))
            form.setError('username', { message }, { shouldFocus: true })
          else toast.error(message)
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5 p-4"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input className="h-12" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  className="h-12"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Lowercase letters, numbers, dots, dashes, or underscores.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" className="h-12" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>At least 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type the password again</FormLabel>
              <FormControl>
                <Input type="password" className="h-12" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <RoleSelect value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormButtons isPending={createUser.isPending} label="Add user" onCancel={onDone} />
      </form>
    </Form>
  )
}

function EditUserForm({
  user,
  currentUserId,
  activeAdminCount,
  onDone,
}: {
  user: UserListItem
  currentUserId: string
  activeAdminCount: number
  onDone: () => void
}) {
  const updateUser = useUpdateUser()
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { full_name: user.full_name, role: user.role },
  })
  // Own account or last admin: the role cannot be changed to cashier.
  const demoteBlocked = checkUserChange({
    actorId: currentUserId,
    target: user,
    change: { role: 'cashier' },
    activeAdminCount,
  })

  function handleSubmit(values: EditUserValues) {
    updateUser.mutate(
      { userId: user.id, fullName: values.full_name, role: values.role, isActive: user.is_active },
      {
        onSuccess: () => {
          toast.success('User saved')
          onDone()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5 p-4"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input className="h-12" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <RoleSelect
                value={field.value}
                onChange={field.onChange}
                disabled={demoteBlocked !== null}
              />
              {demoteBlocked && <FormDescription>{demoteBlocked}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormButtons isPending={updateUser.isPending} label="Save changes" onCancel={onDone} />
      </form>
    </Form>
  )
}
