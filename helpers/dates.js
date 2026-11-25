/**
 * @file Date and time formatting for UK mobile library timetables, using the
 * built-in `Intl` APIs rather than a date library.
 * @module helpers/dates
 */

/** Time zone that all timetable times are expressed in. */
export const TIMEZONE = 'Europe/London'

const ordinalRules = new Intl.PluralRules('en-GB', { type: 'ordinal' })
const ordinalSuffixes = { one: 'st', two: 'nd', few: 'rd', other: 'th' }
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: TIMEZONE })
const monthYearFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: TIMEZONE
})

/**
 * Formats a date in long UK style with an ordinal day, e.g. `1st December 2026`.
 * @param {(Date|string|number)} date - The date to format.
 * @returns {string} The formatted date.
 */
export const formatLongDate = date => {
  const value = new Date(date)
  const day = Number(dayFormat.format(value))
  return `${day}${ordinalSuffixes[ordinalRules.select(day)]} ${monthYearFormat.format(value)}`
}

/**
 * Converts a time of day string to minutes after midnight.
 * @param {string} time - A time in `HH:mm` or `HH:mm:ss` format.
 * @returns {(number|null)} Minutes after midnight, or null if the time is invalid.
 */
export const timeToMinutes = time => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '')
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/**
 * Shortens a time of day string to `HH:mm`.
 * @param {string} time - A time in `HH:mm:ss` format.
 * @returns {string} The time without seconds, or an empty string if missing.
 */
export const formatTime = time => (time ?? '').slice(0, 5)

/**
 * Adds a number of minutes to a date.
 * @param {Date} date - The starting date.
 * @param {number} minutes - Minutes to add.
 * @returns {Date} A new date.
 */
export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000)
