import { normalizeUsername, usernameToEmail } from '@/features/auth/utils/usernameToEmail'

describe('usernameToEmail', () => {
  it('adds the internal login domain', () => {
    expect(usernameToEmail('juan')).toBe('juan@kuyatata.local')
  })

  it('ignores upper case and extra spaces', () => {
    expect(usernameToEmail('  Juan ')).toBe('juan@kuyatata.local')
    expect(usernameToEmail('ADMIN')).toBe('admin@kuyatata.local')
  })

  it('keeps dots, dashes, underscores, and numbers', () => {
    expect(usernameToEmail('maria.santos_2-b')).toBe('maria.santos_2-b@kuyatata.local')
  })
})

describe('normalizeUsername', () => {
  it('trims and lowercases', () => {
    expect(normalizeUsername(' Cashier1 ')).toBe('cashier1')
  })
})
