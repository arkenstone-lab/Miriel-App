// Local timezone date utilities
// Fixes UTC-based toISOString() returning wrong date for users in UTC+ timezones
// (e.g., KST midnight~9AM would show previous day's date with UTC)

/** Returns today's date string (YYYY-MM-DD) in the user's local timezone */
export function getLocalToday(): string {
  return toLocalDateString(new Date())
}

/** Converts a Date object to YYYY-MM-DD string in the user's local timezone */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
