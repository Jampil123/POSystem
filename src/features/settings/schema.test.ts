import { settingsSchema, type SettingsInput } from '@/features/settings/schema'

const valid: SettingsInput = {
  store_name: ' Kuya Tata Store ',
  address: 'Sample Street',
  contact_no: '0900 000 0000',
  vat_enabled: true,
  vat_rate: '12',
  receipt_footer: 'Thank you, come again!',
  receipt_paper_width: '80',
  default_low_stock_level: '5',
}

function errorFor(input: SettingsInput, field: keyof SettingsInput) {
  const result = settingsSchema.safeParse(input)
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('settingsSchema', () => {
  it('turns valid text into numbers', () => {
    expect(settingsSchema.parse(valid)).toMatchObject({
      store_name: 'Kuya Tata Store',
      vat_rate: 12,
      receipt_paper_width: 80,
      default_low_stock_level: 5,
    })
  })

  it('requires a store name', () => {
    expect(errorFor({ ...valid, store_name: ' ' }, 'store_name')).toBe('Enter the store name.')
  })

  it('allows an empty address, contact number, and footer', () => {
    expect(
      settingsSchema.safeParse({ ...valid, address: '', contact_no: '', receipt_footer: '' })
        .success,
    ).toBe(true)
  })

  it('accepts VAT rates from 0 to 100 with up to 2 decimals', () => {
    expect(settingsSchema.parse({ ...valid, vat_rate: '12.5' }).vat_rate).toBe(12.5)
    expect(settingsSchema.parse({ ...valid, vat_rate: '0' }).vat_rate).toBe(0)
    expect(errorFor({ ...valid, vat_rate: '101' }, 'vat_rate')).toBe(
      'The VAT rate cannot be more than 100%.',
    )
    expect(errorFor({ ...valid, vat_rate: '-1' }, 'vat_rate')).toBeDefined()
    expect(errorFor({ ...valid, vat_rate: '12.555' }, 'vat_rate')).toBeDefined()
  })

  it('only allows 58mm or 80mm paper', () => {
    expect(settingsSchema.parse({ ...valid, receipt_paper_width: '58' }).receipt_paper_width).toBe(
      58,
    )
    expect(settingsSchema.safeParse({ ...valid, receipt_paper_width: '76' as '58' }).success).toBe(
      false,
    )
  })

  it('requires a whole-number low-stock level of 0 or more', () => {
    expect(
      errorFor({ ...valid, default_low_stock_level: '2.5' }, 'default_low_stock_level'),
    ).toBeDefined()
    expect(errorFor({ ...valid, default_low_stock_level: '' }, 'default_low_stock_level')).toBe(
      'Enter the default low-stock level.',
    )
    expect(
      settingsSchema.parse({ ...valid, default_low_stock_level: '0' }).default_low_stock_level,
    ).toBe(0)
  })
})
