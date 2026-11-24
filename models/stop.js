const pool = require('../helpers/database')

const iCalHelper = require('../helpers/ical')
const pdfHelper = require('../helpers/pdf')
const moment = require('moment')

const viewFields = [
  'id',
  'route_ids',
  'route_names',
  'mobile_ids',
  'mobile_names',
  'local_authority_id',
  'local_authority_name',
  'local_authority_colour',
  'local_authority_code',
  'name',
  'community',
  'address',
  'postcode',
  'arrival_times',
  'departure_times',
  'route_start',
  'route_end',
  'route_days',
  'type',
  'exceptions',
  'route_frequencies',
  'route_schedule',
  'timetable',
  'longitude',
  'latitude'
]

module.exports.getViewFields = () => viewFields

module.exports.getStops = async (
  localAuthorityIds,
  mobileIds,
  routeIds,
  localAuthorityCodes,
  longitude,
  latitude,
  distance,
  limit,
  page,
  sort,
  direction
) => {
  let stops = []
  let authorities = []
  if (localAuthorityIds) {
    authorities = String(localAuthorityIds)
      .split('|')
      .map(o => parseInt(o.trim(), 10))
      .filter(n => !isNaN(n))
  }

  let mobiles = []
  if (mobileIds) {
    mobiles = String(mobileIds)
      .split('|')
      .map(m => parseInt(m.trim(), 10))
      .filter(n => !isNaN(n))
  }

  let routes = []
  if (routeIds) {
    routes = String(routeIds)
      .split('|')
      .map(r => parseInt(r.trim(), 10))
      .filter(n => !isNaN(n))
  }

  let authorityCodes = []
  if (localAuthorityCodes) {
    authorityCodes = String(localAuthorityCodes)
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  const parsedLimit = limit ? parseInt(limit, 10) : 1000
  const parsedPage = page ? parseInt(page, 10) : 1
  const validDirection = direction && direction.toLowerCase() === 'desc' ? 'desc' : 'asc'

  try {
    const whereQueries = []
    let limitQuery = ''
    let offsetQuery = ''
    let orderbyQuery = ''
    const selectFields = [...viewFields]
    let params = []

    if (parsedLimit) {
      params.push(parsedLimit)
      limitQuery = `limit $${params.length}`
    }

    if (parsedPage && parsedLimit) {
      const offset = parsedLimit * (parsedPage - 1)
      params.push(offset)
      offsetQuery = `offset $${params.length}`
    }

    if (viewFields.indexOf(sort) !== -1) {
      orderbyQuery = `order by ${sort} ${validDirection}`
    }

    if (authorities.length > 0) {
      const authPlaceholders = authorities
        .map((_, idx) => `$${params.length + idx + 1}::int`)
        .join(',')
      whereQueries.push(`local_authority_id in (${authPlaceholders})`)
      params = params.concat(authorities)
    }

    if (mobiles.length > 0) {
      const mobilePlaceholders = mobiles
        .map((_, idx) => `$${params.length + idx + 1}::int`)
        .join(',')
      whereQueries.push(`mobile_ids && Array[${mobilePlaceholders}]`)
      params = params.concat(mobiles)
    }

    if (routes.length > 0) {
      const routePlaceholders = routes
        .map((_, idx) => `$${params.length + idx + 1}::int`)
        .join(',')
      whereQueries.push(`route_ids && Array[${routePlaceholders}]`)
      params = params.concat(routes)
    }

    if (authorityCodes.length > 0) {
      const codePlaceholders = authorityCodes
        .map((_, idx) => `$${params.length + idx + 1}`)
        .join(',')
      whereQueries.push(`local_authority_code in (${codePlaceholders})`)
      params = params.concat(authorityCodes)
    }

    if (longitude && latitude && distance) {
      const longitudeParam = params.length + 1
      const latitudeParam = params.length + 2
      const distanceParam = params.length + 3

      whereQueries.push(
        `st_dwithin(st_transform(st_setsrid(st_makepoint($${longitudeParam}, $${latitudeParam}), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700), $${distanceParam})`
      )
      selectFields.push(
        `round(st_distance(st_transform(st_setsrid(st_makepoint($${longitudeParam}, $${latitudeParam}), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700))) as distance`
      )
      params = params.concat([longitude, latitude, distance])

      if (sort === 'distance') {
        orderbyQuery = `order by distance ${validDirection}`
      }
    }

    if (!orderbyQuery) {
      orderbyQuery = 'order by id asc'
    }

    const whereQuery =
      whereQueries.length > 0 ? `where ${whereQueries.join(' and ')}` : ''
    const query = `select ${selectFields.join(
      ', '
    )}, count(*) OVER() AS total from vw_stops ${whereQuery} ${orderbyQuery} ${limitQuery} ${offsetQuery}`

    const { rows } = await pool.query(query, params)
    stops = rows
  } catch (e) {
    console.error(e)
  }
  return stops
}

module.exports.getNearestStops = async (longitude, latitude, limit) => {
  let stops = []
  try {
    const query =
      'select ' +
      viewFields.join(', ') +
      ', round(ST_Distance(st_transform(st_setsrid(st_makepoint($1, $2), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700))) as distance from vw_stops order by distance ASC LIMIT $3'
    const { rows } = await pool.query(query, [longitude, latitude, limit || 1])
    if (rows.length > 0) stops = rows
  } catch (e) {
    console.error(e)
  }
  return stops
}

module.exports.getStopById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) stop = rows[0]
  } catch (e) {
    console.error(e)
  }
  return stop
}

module.exports.getStopPdfById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) {
      stop = rows[0]

      const dates = (stop.route_schedule || []).map(d => {
        return moment(d).format('Do MMMM YYYY')
      })
      const maxChunk = Math.max(1, Math.ceil(dates.length / 4))
      const dates1 = dates.splice(0, maxChunk)
      const dates2 = dates.splice(0, maxChunk)
      const dates3 = dates.splice(0, maxChunk)
      const dates4 = dates.splice(0, maxChunk)

      const content = [
        {
          text: stop.local_authority_name || '',
          style: 'smallheader',
          margin: [0, 0, 0, 4]
        },
        {
          text: stop.name || '',
          style: 'header',
          margin: [0, 0, 0, 10]
        },
        {
          layout: 'librariesLayout',
          table: {
            headerRows: 1,
            widths: ['auto', 'auto'],
            body: [
              ['Stop', stop.name || ''],
              [
                'Address',
                (stop.address || '') + (stop.postcode ? ', ' + stop.postcode : '')
              ],
              ['Days', (stop.route_days || []).join(', ')]
            ]
          },
          margin: [0, 0, 0, 15]
        },
        { text: 'Dates', style: 'subheader', margin: [0, 0, 0, 8] },
        {
          layout: 'librariesLayout',
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto'],
            body: [[dates1, dates2, dates3, dates4]]
          },
          margin: [0, 0, 0, 15]
        }
      ]

      if (stop.timetable) {
        content.push(
          { qr: stop.timetable, fit: 120, margin: [0, 0, 0, 15] },
          { text: stop.timetable, link: stop.timetable }
        )
      }

      const definition = { content }
      const stream = await pdfHelper.createPDFStream(definition)
      return stream
    } else {
      return null
    }
  } catch (e) {
    console.error(e)
    return null
  }
}

module.exports.getStopCalendarById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) {
      stop = rows[0]
      const mobileName =
        stop.mobile_names && stop.mobile_names.length > 0
          ? stop.mobile_names.join(', ')
          : 'Mobile library'

      const startVisit =
        stop.route_schedule && stop.route_schedule.length > 0
          ? stop.route_schedule[0]
          : null
      const endVisit =
        stop.route_schedule && stop.route_schedule.length > 0
          ? stop.route_schedule[stop.route_schedule.length - 1]
          : null

      const startTime = startVisit ? moment(startVisit) : moment()
      let endTime = moment(startTime).add(30, 'minutes')

      if (
        stop.arrival_times &&
        stop.arrival_times[0] &&
        stop.departure_times &&
        stop.departure_times[0]
      ) {
        const arr = moment(stop.arrival_times[0], 'HH:mm:ss')
        const dep = moment(stop.departure_times[0], 'HH:mm:ss')
        const diff = dep.diff(arr, 'minutes')
        if (diff > 0) {
          endTime = moment(startTime).add(diff, 'minutes')
        }
      }

      const frequency =
        stop.route_frequencies && stop.route_frequencies[0]
          ? stop.route_frequencies[0]
          : 'FREQ=WEEKLY'

      const untilDate = endVisit
        ? moment(endVisit).format('YYYYMMDD')
        : moment().add(1, 'year').format('YYYYMMDD')

      const cal = {
        name: `${stop.name} Mobile Library`,
        summary: `${mobileName} visit`,
        description: `${stop.local_authority_name || ''} ${mobileName} visiting ${stop.name}`,
        location:
          (stop.address || '') + (stop.postcode ? ', ' + stop.postcode : ''),
        start: startTime.format(),
        end: endTime.format(),
        rrule: `${frequency};UNTIL=${untilDate}`,
        url: stop.timetable || '',
        latitude: stop.latitude,
        longitude: stop.longitude
      }
      return iCalHelper.createCalendar(cal)
    } else {
      return null
    }
  } catch (e) {
    console.error(e)
    return null
  }
}

module.exports.getTileData = async (x, y, z) => {
  const query = 'select fn_stops_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_stops_mvt) {
      tile = rows[0].fn_stops_mvt
    }
  } catch (e) {
    console.error(e)
  }
  return tile
}
