/**
 * @file Builds iCalendar (RFC 5545) files for stop visits.
 * @module helpers/ical
 */

import ical from 'ical-generator'
import { TIMEZONE } from './dates.js'

/**
 * A single calendar event definition.
 * @typedef {object} CalendarEvent
 * @property {string} [id] - Stable unique ID.
 * @property {(Date|string)} start - Start time.
 * @property {(Date|string)} end - End time.
 * @property {string} summary - Event title.
 * @property {string} [description] - Longer description.
 * @property {string} [location] - Address or location text.
 * @property {?number} [latitude] - WGS84 latitude.
 * @property {?number} [longitude] - WGS84 longitude.
 * @property {string} [url] - Related URL.
 * @property {string} [rrule] - Recurrence rule string (e.g. `FREQ=WEEKLY;INTERVAL=2;UNTIL=...`).
 */

/**
 * Creates an iCalendar document. Event times are written with a
 * `TZID=Europe/London` reference so they display correctly in any timezone.
 *
 * Supports both `{ name, events: [...] }` and a single event object `{ name, summary, start, end, ... }`.
 * @param {object} data - Calendar definition.
 * @param {string} [data.name] - Calendar name shown by clients.
 * @param {CalendarEvent[]} [data.events] - Array of events.
 * @returns {string} The iCalendar RFC 5545 text.
 */
export const createCalendar = data => {
  const name = data.name || 'Mobile Library'
  const cal = ical({
    name,
    timezone: TIMEZONE,
    prodId: { company: 'Libraries Hacked', product: 'Mobile Libraries', language: 'EN' }
  })

  const eventList = Array.isArray(data.events) ? data.events : [data]
  for (const event of eventList) {
    if (!event || !event.start) continue
    const hasGeo = event.latitude != null && event.longitude != null
    const icalEvent = cal.createEvent({
      id: event.id,
      start: new Date(event.start),
      end: new Date(event.end),
      timezone: TIMEZONE,
      summary: event.summary,
      description: event.description || null,
      url: event.url || null,
      location: event.location
        ? {
            title: event.location,
            ...(hasGeo && { geo: { lat: Number(event.latitude), lon: Number(event.longitude) } })
          }
        : null
    })

    if (event.rrule) {
      try {
        icalEvent.repeating(event.rrule)
      } catch (e) {
        console.error('Error applying rrule to iCal event:', e.message)
      }
    }
  }

  return cal.toString()
}

export default { createCalendar }
