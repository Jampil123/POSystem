import { addDays, dayOfWeek, manilaDateString } from '@/lib/manilaTime'

export type DateRange = {
  /** yyyy-MM-dd, included */
  from: string
  /** yyyy-MM-dd, included */
  to: string
}

export type DatePreset = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'custom'

export const datePresetLabels: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  'this-month': 'This month',
  custom: 'Custom',
}

// Date range of a preset, using the date in the Philippines (not the device's time zone).
// Weeks start on Monday. "This week" and "This month" end today.
// Custom has no fixed range; it returns today until dates are picked.
export function getPresetRange(preset: DatePreset, now: Date = new Date()): DateRange {
  const today = manilaDateString(now)

  switch (preset) {
    case 'yesterday': {
      const yesterday = addDays(today, -1)
      return { from: yesterday, to: yesterday }
    }
    case 'this-week': {
      const daysSinceMonday = (dayOfWeek(today) + 6) % 7
      return { from: addDays(today, -daysSinceMonday), to: today }
    }
    case 'this-month':
      return { from: `${today.slice(0, 8)}01`, to: today }
    case 'today':
    case 'custom':
      return { from: today, to: today }
  }
}

/** Number of days in a range, counting both ends. */
export function rangeLength({ from, to }: DateRange): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000) + 1
}

/** Problem with a custom range, or null when it can be used (the database allows one year). */
export function rangeError(range: DateRange): string | null {
  if (!range.from || !range.to) return 'Choose both dates.'
  if (range.from > range.to) return 'The start date is after the end date.'
  if (rangeLength(range) > 367) return 'Choose a range of one year or less.'
  return null
}
