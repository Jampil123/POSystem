import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { UserListItem } from '@/features/users/api'
import { useResetPassword } from '@/features/users/hooks/useUsers'
import { resetPasswordSchema, type ResetPasswordValues } from '@/features/users/schema'
import { errorMessage } from '@/lib/errors'

type ResetPasswordDialogProps = {
  /** null closes the dialog. */
  user: UserListItem | null
  onClose: () => void
}

export function ResetPasswordDialog({ user, onClose }: ResetPasswordDialogProps) {
  const resetPassword = useResetPassword()
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  })

  function close() {
    form.reset()
    onClose()
  }

  function handleSubmit(values: ResetPasswordValues) {
    if (!user) return
    resetPassword.mutate(
      { userId: user.id, password: values.password },
      {
        onSuccess: () => {
          toast.success(`Password changed for ${user.username}`)
          close()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-md:h-dvh max-md:max-w-full max-md:content-start max-md:rounded-none sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.full_name} ({user?.username}). Tell them the new password
            in person.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="h-12"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
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
                    <Input
                      type="password"
                      className="h-12"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" className="h-12" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" className="h-12" disabled={resetPassword.isPending}>
                {resetPassword.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Change password
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
