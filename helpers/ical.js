const ical = require('ical-generator') // For generating the event
const icalJs = require('ical.js') // For parsing the recur rule

const prod = {
  company: 'Libraries Hacked',
  product: 'Mobile Libraries',
  language: 'EN'
}
const timezone = 'Europe/London'
ical().timezone(timezone)

module.exports.createCalendar = (data) => {
  // The recur object using ical.js
  const recur = new icalJs.Recur.fromString(data.rrule) // eslint-disable-line

  // The calendar using ical-generator
  const cal = ical({ domain: 'mobilelibraries.org', name: data.name })
  cal.prodId(prod)

  // The event details
  const event = cal.createEvent({
    start: data.start,
    end: data.end,
    summary: data.summary,
    description: data.description,
    location: data.location,
    url: data.url
  })
  event.repeating({
    freq: recur.freq,
    interval: recur.interval,
    until: recur.until.toString()
  })
  event.geo({
    lat: data.latitude,
    lon: data.longitude
  })

  return cal.toString()
}
