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
  'organisation_id',
  'organisation_name',
  'service_code',
  'name',
  'community',
  'address',
  'postcode',
  'arrival_times',
  'departure_times',
  'route_start',
  'route_end',
  'route_days',
  'route_frequencies',
  'route_schedule',
  'timetable',
  'longitude',
  'latitude'
]
const tableFields = ['name', 'community', 'address', 'timetable']

module.exports.getStops = async (
  organisationIds,
  mobileIds,
  routeIds,
  serviceCodes,
  longitude,
  latitude,
  distance,
  limit,
  page,
  sort
) => {
  let stops = []
  let organisations = []
  if (organisationIds)
    organisations = organisationIds.split('|').map(o => parseInt(o))
  let mobiles = []
  if (mobileIds) mobiles = mobileIds.split('|').map(m => parseInt(m))
  let routes = []
  if (routeIds) routes = routeIds.split('|').map(r => parseInt(r))
  let services = []
  if (serviceCodes) services = serviceCodes.split('|')
  let params = [
    ['limit', limit],
    ['page', page]
  ].filter(x => x[1] !== null)
  try {
    const whereQueries = []
    let limitQuery = ''
    let offsetQuery = ''
    let orderbyQuery = ' '
    let selectFields = [...viewFields]

    params.forEach((param, i) => {
      const idx = i + 1
      if (param[0] === 'limit') limitQuery = `limit $${idx}`
      if (param[0] === 'page') {
        params[i][1] = limit * (page - 1) // Calculate offset from the page and limit
        offsetQuery = `offset $${idx}`
      }
    })

    if (viewFields.indexOf(sort) !== -1) orderbyQuery = `order by ${sort} asc`
    params = params.map(p => p[1]) // Change params array just to values.

    if (organisations.length > 0) {
      const organisations_query_list = organisations
        .map((o, oidx) => `$${oidx + 1 + params.length}::int`)
        .join(',')

      whereQueries.push(`organisation_id in (${organisations_query_list})`)
      params = params.concat(organisations)
    }

    if (mobiles.length > 0) {
      const mobiles_query_list = mobiles
        .map((m, midx) => `$${midx + 1 + params.length}::int`)
        .join(',')

      whereQueries.push(`mobile_ids && Array[${mobiles_query_list}]`)
      params = params.concat(mobiles)
    }

    if (routes.length > 0) {
      const routes_query_list = routes
        .map((r, ridx) => `$${ridx + 1 + params.length}::int`)
        .join(',')
      whereQueries.push(`route_ids && Array[${routes_query_list}]`)
      params = params.concat(routes)
    }

    if (services.length > 0) {
      whereQueries.push(
        'service_code in (' +
          services
            .map((o, oidx) => '$' + (oidx + 1 + params.length))
            .join(',') +
          ')'
      )
      params = params.concat(services)
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
    }

    const where_query =
      whereQueries.length > 0 ? `where ${whereQueries.join(' and ')} ` : ``
    const query = `select ${viewFields.join(
      ', '
    )}, count(*) OVER() AS total from vw_stops ${where_query} ${orderbyQuery} ${limitQuery} ${offsetQuery}`

    const { rows } = await pool.query(query, params)

    stops = rows
  } catch (e) {}
  return stops
}

module.exports.getNearestStops = async (longitude, latitude, limit) => {
  let stops = []
  try {
    const query =
      'select ' +
      viewFields.join(', ') +
      ', ST_Distance(st_transform(st_setsrid(st_makepoint($1, $2), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700)) as distance from vw_stops order by distance ASC LIMIT $3'
    const { rows } = await pool.query(query, [longitude, latitude, limit])
    if (rows.length > 0) stops = rows
  } catch (e) {}
  return stops
}

module.exports.getStopById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) stop = rows[0]
  } catch (e) {}
  return stop
}

module.exports.getStopPdfById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) {
      stop = rows[0]

      const dates = stop.route_schedule.map(d => {
        return moment(d).format('Do MMMM YYYY')
      })
      const maxChunk = Math.ceil(dates.length / 4)
      const dates1 = dates.splice(0, maxChunk)
      const dates2 = dates.splice(0, maxChunk)
      const dates3 = dates.splice(0, maxChunk)
      const dates4 = dates.splice(0, maxChunk)

      const definition = {
        content: [
          {
            text: stop.organisation_name,
            style: 'smallheader',
            margin: [0, 0, 0, 4]
          },
          {
            text: stop.name,
            style: 'header',
            margin: [0, 0, 0, 10]
          },
          {
            layout: 'librariesLayout',
            table: {
              headerRows: 1,
              widths: ['auto', 'auto'],
              body: [
                ['Stop', stop.name],
                [
                  'Address',
                  stop.address + (stop.postcode ? ', ' + stop.postcode : '')
                ],
                ['Days', stop.route_days.join(', ')]
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
          },
          { qr: stop.timetable, fit: '120', margin: [0, 0, 0, 15] },
          { text: stop.timetable, link: stop.timetable }
        ]
      }

      const stream = pdfHelper.createPDFStream(definition)
      return stream
    } else {
      return null
    }
  } catch (e) {}
}

module.exports.getStopCalendarById = async id => {
  let stop = null
  try {
    const query = `select ${viewFields.join(', ')} from vw_stops where id = $1`
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) {
      stop = rows[0]
      const cal = {
        summary: `${stop.mobile_name} mobile library visit`,
        description: `${stop.organisation_name} ${stop.mobile_name} visiting ${stop.name}`,
        location: stop.address,
        start: moment(`${stop.route_dates[0]} ${stop.arrival}`).format(),
        end: moment(`${stop.route_dates[0]} ${stop.departure}`).format(),
        rrule: `${stop.route_frequency};UNTIL=${moment(
          stop.route_dates[stop.route_dates.length - 1]
        ).format('YYYYMMDD')}`,
        url: stop.timetable,
        latitude: stop.latitude,
        longitude: stop.longitude
      }
      return iCalHelper.createCalendar(cal)
    } else {
      return null
    }
  } catch (e) {}
}

module.exports.getTileData = async (x, y, z) => {
  const query = 'select fn_stops_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_stops_mvt)
      tile = rows[0].fn_stops_mvt
  } catch (e) {}
  return tile
}

module.exports.createStop = async stop => {
  try {
    const insert_values = tableFields
      .map((f, idx) => '$' + (idx + 1))
      .join(', ')

    const query = `insert into mobile (${tableFields.join(
      ', '
    )}) values(${insert_values})`
    const params = tableFields.map(f => (stop[f] ? stop[f] : null))
    await pool.query(query, params)
  } catch (e) {}
  return stop
}

module.exports.updateStop = async (id, stop) => {
  const sets = []
  const params = [id]
  Object.keys(stop).forEach(key => {
    if (tableFields.indexOf(key) !== -1) {
      params.push(stop[key])
      sets.push(`${key}=$${params.length}`)
    }
  })
  try {
    const query = `update stop set ${sets.join(',')} where id = $1`
    await pool.query(query, params)
  } catch (e) {}
  return stop
}
