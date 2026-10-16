import { getPresetRange, rangeError, rangeLength } from '@/features/reports/utils/dateRanges'
import { reportFileName } from '@/features/reports/utils/reportFileName'
import { manilaDateString, manilaDayEnd, manilaDayStart } from '@/lib/manilaTime'

// Friday, Oct 16, 2026, 1:30 AM in Manila = Thursday, Oct 15, 5:30 PM UTC.
// A device set to UTC would still say Oct 15; the reports must say Oct 16.
const lateNightUtc = new Date('2026-10-15T17:30:00Z')

describe('manilaDateString', () => {
  it('uses the date in the Philippines, not UTC', () => {
    expect(manilaDateString(lateNightUtc)).toBe('2026-10-16')
  })

  it('changes the day at midnight Manila time', () => {
    expect(manilaDateString(new Date('2026-10-15T15:59:59Z'))).toBe('2026-10-15')
    expect(manilaDateString(new Date('2026-10-15T16:00:00Z'))).toBe('2026-10-16')
  })
})

describe('manilaDayStart / manilaDayEnd', () => {
  it('starts a Manila day at 16:00 UTC the day before', () => {
    expect(manilaDayStart('2026-10-16')).toBe('2026-10-15T16:00:00.000Z')
    expect(manilaDayEnd('2026-10-16')).toBe('2026-10-16T16:00:00.000Z')
  })
})

describe('getPresetRange (Asia/Manila)', () => {
  it('Today', () => {
    expect(getPresetRange('today', lateNightUtc)).toEqual({ from: '2026-10-16', to: '2026-10-16' })
  })

  it('Yesterday', () => {
    expect(getPresetRange('yesterday', lateNightUtc)).toEqual({
      from: '2026-10-15',
      to: '2026-10-15',
    })
  })

  it('This week starts on Monday', () => {
    // Oct 16, 2026 is a Friday; that week's Monday is Oct 12.
    expect(getPresetRange('this-week', lateNightUtc)).toEqual({
      from: '2026-10-12',
      to: '2026-10-16',
    })
  })

  it('This week on a Monday is just that day', () => {
    expect(getPresetRange('this-week', new Date('2026-10-12T03:00:00Z'))).toEqual({
      from: '2026-10-12',
      to: '2026-10-12',
    })
  })

  it('This week on a Sunday goes back to Monday', () => {
    expect(getPresetRange('this-week', new Date('2026-10-18T03:00:00Z'))).toEqual({
      from: '2026-10-12',
      to: '2026-10-18',
    })
  })

  it('This month', () => {
    expect(getPresetRange('this-month', lateNightUtc)).toEqual({
      from: '2026-10-01',
      to: '2026-10-16',
    })
  })

  it('Yesterday on the first of the month is the last day of the previous month', () => {
    expect(getPresetRange('yesterday', new Date('2026-03-01T03:00:00Z'))).toEqual({
      from: '2026-02-28',
      to: '2026-02-28',
    })
  })

  it('Custom starts as today', () => {
    expect(getPresetRange('custom', lateNightUtc)).toEqual({ from: '2026-10-16', to: '2026-10-16' })
  })
})

describe('rangeLength and rangeError', () => {
  it('counts both ends', () => {
    expect(rangeLength({ from: '2026-10-01', to: '2026-10-31' })).toBe(31)
    expect(rangeLength({ from: '2026-10-16', to: '2026-10-16' })).toBe(1)
  })

  it('rejects a reversed or empty range', () => {
    expect(rangeError({ from: '2026-10-20', to: '2026-10-01' })).toBe(
      'The start date is after the end date.',
    )
    expect(rangeError({ from: '', to: '2026-10-01' })).toBe('Choose both dates.')
  })

  it('accepts a range of up to one year', () => {
    expect(rangeError({ from: '2026-01-01', to: '2026-12-31' })).toBeNull()
    expect(rangeError({ from: '2025-01-01', to: '2026-12-31' })).not.toBeNull()
  })
})

describe('reportFileName', () => {
  it('includes the report name and date range', () => {
    expect(reportFileName('sales-report', { from: '2026-10-01', to: '2026-10-31' }, 'xlsx')).toBe(
      'sales-report_2026-10-01_to_2026-10-31.xlsx',
    )
  })

  it('works for PDFs and single days', () => {
    expect(reportFileName('sales-report', { from: '2026-10-16', to: '2026-10-16' }, 'pdf')).toBe(
      'sales-report_2026-10-16_to_2026-10-16.pdf',
    )
  })
})
