import { editUserSchema, newUserSchema, resetPasswordSchema } from '@/features/users/schema'

const validUser = {
  full_name: 'Juan Dela Cruz',
  username: 'Juan',
  password: 'secret123',
  confirm_password: 'secret123',
  role: 'cashier',
}

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? [])
}

describe('newUserSchema', () => {
  it('accepts a valid user and lowercases the username', () => {
    expect(newUserSchema.parse(validUser)).toMatchObject({ username: 'juan', role: 'cashier' })
  })

  it('requires a password of at least 8 characters', () => {
    expect(
      messages(
        newUserSchema.safeParse({ ...validUser, password: 'short', confirm_password: 'short' }),
      ),
    ).toContain('Use at least 8 characters.')
  })

  it('requires both passwords to match', () => {
    expect(
      messages(newUserSchema.safeParse({ ...validUser, confirm_password: 'different1' })),
    ).toContain('The two passwords do not match.')
  })

  it('rejects usernames with spaces', () => {
    expect(newUserSchema.safeParse({ ...validUser, username: 'juan dela cruz' }).success).toBe(
      false,
    )
  })

  it('requires a name and a role', () => {
    expect(messages(newUserSchema.safeParse({ ...validUser, full_name: ' ' }))).toContain(
      'Enter the full name.',
    )
    expect(messages(newUserSchema.safeParse({ ...validUser, role: 'manager' }))).toContain(
      'Choose a role.',
    )
  })
})

describe('editUserSchema', () => {
  it('accepts a name and role', () => {
    expect(editUserSchema.parse({ full_name: ' Maria ', role: 'admin' })).toEqual({
      full_name: 'Maria',
      role: 'admin',
    })
  })
})

describe('resetPasswordSchema', () => {
  it('requires 8 characters and matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'newpass12', confirm_password: 'newpass12' })
        .success,
    ).toBe(true)
    expect(
      resetPasswordSchema.safeParse({ password: 'newpass12', confirm_password: 'newpass13' })
        .success,
    ).toBe(false)
    expect(
      resetPasswordSchema.safeParse({ password: 'short', confirm_password: 'short' }).success,
    ).toBe(false)
  })
})
