import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { loginSchema, type LoginValues } from '@/features/auth/schema'

type LoginFormProps = {
  /** Message shown before the first try, e.g. when an account was turned off. */
  notice?: string
}

export function LoginForm({ notice }: LoginFormProps) {
  const login = useLogin()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const errorMessage = login.error?.message ?? (login.isIdle ? notice : undefined)

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
        className="grid gap-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-12"
                  {...field}
                />
              </FormControl>
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
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-12 w-full text-base" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>

        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
      </form>
    </Form>
  )
}
