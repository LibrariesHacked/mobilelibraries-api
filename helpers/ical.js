const ical = require('ical-generator') // For generating the event
const icalJs = require('ical.js') // For parsing the recur rule

const prod = {
  company: 'Libraries Hacked',
  product: 'Mobile Libraries',
  language: 'en'
}

const timezone = 'Europe/London'
ical().timezone(timezone)

module.exports.createCalendar = data => {
  // The calendar using ical-generator
  const cal = ical({ domain: 'mobilelibraries.org', name: data.name })
  cal.prodId(prod)

  // The event details
  const event = cal.createEvent({
    start: data.start,
    end: data.end,
    summary: data.summary,
    description: data.description,
    url: data.url
  })

  if (data.location) {
    if (data.latitude != null && data.longitude != null) {
      event.location({
        title: data.location,
        geo: {
          lat: data.latitude,
          lon: data.longitude
        }
      })
    } else {
      event.location(data.location)
    }
  }

  if (data.rrule) {
    try {
      const recur = new icalJs.Recur.fromString(data.rrule)
      const repeatingConfig = {
        freq: recur.freq,
        interval: recur.interval
      }
      if (recur.until) {
        repeatingConfig.until = recur.until.toString()
      }
      if (recur.count) {
        repeatingConfig.count = recur.count
      }
      event.repeating(repeatingConfig)
    } catch (e) {
      console.error('Error parsing rrule in createCalendar:', e.message)
    }
  }

  return cal.toString()
}
