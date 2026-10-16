// Dates in Philippine time (Asia/Manila, UTC+8, no daylight saving time).
// Report days and transaction date filters use these, so they match the
// database, which groups days with "at time zone 'Asia/Manila'".

export const MANILA_TIME_ZONE = 'Asia/Manila'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
})

/** The Manila calendar date of a moment, as yyyy-MM-dd. */
export function manilaDateString(moment: Date = new Date()): string {
  return dateFormatter.format(moment)
}

/** Adds days to a yyyy-MM-dd date (negative to go back). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** Day of the week of a yyyy-MM-dd date: 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** The moment a Manila day starts, as an ISO time for database filters. */
export function manilaDayStart(date: string): string {
  return new Date(`${date}T00:00:00+08:00`).toISOString()
}

/** The moment the next Manila day starts (use with "less than" to include the whole day). */
export function manilaDayEnd(date: string): string {
  return manilaDayStart(addDays(date, 1))
}

/** "10/16/2026, 8:15 AM" in Manila time. */
export function formatManilaDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate))
}
