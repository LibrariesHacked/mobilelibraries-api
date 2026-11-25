/**
 * @file Stop model. Represents physical mobile library stops, printable flyers,
 * iCalendar visit schedules, and vector tiles.
 * @module models/stop
 */

import pool from '../helpers/database.js'
import { createCalendar } from '../helpers/ical.js'
import { createPdf } from '../helpers/pdf.js'
import { formatLongDate } from '../helpers/dates.js'

/**
 * A mobile library stop, as exposed by `vw_stops`.
 */
export class Stop {
  /**
   * Database columns selected from `vw_stops`.
   * @type {string[]}
   */
  static fields = [
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

  /**
   * Creates a Stop instance from a database row.
   * @param {object} row - A row from `vw_stops`.
   */
  constructor (row) {
    this.id = row.id
    this.route_ids = row.route_ids
    this.route_names = row.route_names
    this.mobile_ids = row.mobile_ids
    this.mobile_names = row.mobile_names
    this.local_authority_id = row.local_authority_id
    this.local_authority_name = row.local_authority_name
    this.local_authority_colour = row.local_authority_colour
    this.local_authority_code = row.local_authority_code
    this.name = row.name
    this.community = row.community
    this.address = row.address
    this.postcode = row.postcode
    this.arrival_times = row.arrival_times
    this.departure_times = row.departure_times
    this.route_start = row.route_start
    this.route_end = row.route_end
    this.route_days = row.route_days
    this.type = row.type
    this.exceptions = row.exceptions
    this.route_frequencies = row.route_frequencies
    this.route_schedule = row.route_schedule
    this.timetable = row.timetable
    this.longitude = row.longitude != null ? Number(row.longitude) : null
    this.latitude = row.latitude != null ? Number(row.latitude) : null
    if (row.distance !== undefined) {
      this.distance = Number(row.distance)
    }
    if (row.total !== undefined) {
      this.total = Number(row.total)
    }
  }

  /**
   * Gets the list of view field names.
   * @returns {string[]} Field names.
   */
  static getViewFields () {
    return Stop.fields
  }

  /**
   * Queries stops matching criteria, supporting pagination, proximity search, and sorting.
   * @param {?(string|number)} localAuthorityIds - Pipe-separated local authority IDs.
   * @param {?(string|number)} mobileIds - Pipe-separated mobile IDs.
   * @param {?(string|number)} routeIds - Pipe-separated route IDs.
   * @param {?string} localAuthorityCodes - Pipe-separated GSS codes.
   * @param {?(number|string)} longitude - WGS84 longitude for distance filtering.
   * @param {?(number|string)} latitude - WGS84 latitude for distance filtering.
   * @param {?(number|string)} distance - Search distance in metres.
   * @param {?(number|string)} [limit] - Maximum rows to return.
   * @param {?(number|string)} [page] - 1-based page number.
   * @param {?string} [sort] - Field to sort by.
   * @param {?string} [direction] - Sort order (`asc` or `desc`).
   * @returns {Promise<Stop[]>} Array of Stop instances.
   */
  static async getStops (
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
  ) {
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
      const selectFields = [...Stop.fields]
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

      if (Stop.fields.indexOf(sort) !== -1) {
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
      stops = rows.map(r => new Stop(r))
    } catch (e) {
      console.error(e)
    }
    return stops
  }

  /**
   * Gets nearest stops to coordinates ordered by proximity.
   * @param {number|string} longitude - Longitude.
   * @param {number|string} latitude - Latitude.
   * @param {number|string} [limit] - Number of stops to return.
   * @returns {Promise<Stop[]>} Nearest stops.
   */
  static async getNearestStops (longitude, latitude, limit) {
    let stops = []
    try {
      const query =
        'select ' +
        Stop.fields.join(', ') +
        ', round(ST_Distance(st_transform(st_setsrid(st_makepoint($1, $2), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700))) as distance from vw_stops order by distance ASC LIMIT $3'
      const { rows } = await pool.query(query, [longitude, latitude, limit || 1])
      if (rows.length > 0) stops = rows.map(r => new Stop(r))
    } catch (e) {
      console.error(e)
    }
    return stops
  }

  /**
   * Gets a stop by ID.
   * @param {number|string} id - Stop ID.
   * @returns {Promise<?Stop>} The stop or null.
   */
  static async getStopById (id) {
    let stop = null
    try {
      const query = `select ${Stop.fields.join(', ')} from vw_stops where id = $1`
      const { rows } = await pool.query(query, [id])
      if (rows.length > 0) stop = new Stop(rows[0])
    } catch (e) {
      console.error(e)
    }
    return stop
  }

  /**
   * Generates a PDF flyer Buffer for a stop.
   * @param {number|string} id - Stop ID.
   * @returns {Promise<?Buffer>} The PDF buffer or null.
   */
  static async getStopPdfById (id) {
    try {
      const query = `select ${Stop.fields.join(', ')} from vw_stops where id = $1`
      const { rows } = await pool.query(query, [id])
      if (rows.length === 0) return null
      const stop = rows[0]

      const dates = (stop.route_schedule || []).map(d => formatLongDate(d))
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
      return await createPdf(definition)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Generates an iCalendar (RFC 5545) visit schedule string for a stop.
   * @param {number|string} id - Stop ID.
   * @returns {Promise<?string>} The iCalendar text or null.
   */
  static async getStopCalendarById (id) {
    try {
      const query = `select ${Stop.fields.join(', ')} from vw_stops where id = $1`
      const { rows } = await pool.query(query, [id])
      if (rows.length === 0) return null
      const stop = rows[0]

      const mobileName =
        stop.mobile_names && stop.mobile_names.length > 0
          ? stop.mobile_names.join(', ')
          : 'Mobile library'

      const startVisit =
        stop.route_schedule && stop.route_schedule.length > 0
          ? new Date(stop.route_schedule[0])
          : new Date()

      let durationMinutes = 30
      if (
        stop.arrival_times &&
        stop.arrival_times[0] &&
        stop.departure_times &&
        stop.departure_times[0]
      ) {
        const [aH, aM] = stop.arrival_times[0].split(':').map(Number)
        const [dH, dM] = stop.departure_times[0].split(':').map(Number)
        const diff = (dH * 60 + dM) - (aH * 60 + aM)
        if (diff > 0) durationMinutes = diff
      }

      const endVisit = new Date(startVisit.getTime() + durationMinutes * 60000)

      const frequency =
        stop.route_frequencies && stop.route_frequencies[0]
          ? stop.route_frequencies[0]
          : 'FREQ=WEEKLY'

      const lastVisit =
        stop.route_schedule && stop.route_schedule.length > 0
          ? new Date(stop.route_schedule[stop.route_schedule.length - 1])
          : new Date(Date.now() + 365 * 24 * 3600 * 1000)

      const untilDate = lastVisit.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

      const cal = {
        name: `${stop.name} Mobile Library`,
        summary: `${mobileName} visit`,
        description: `${stop.local_authority_name || ''} ${mobileName} visiting ${stop.name}`,
        location:
          (stop.address || '') + (stop.postcode ? ', ' + stop.postcode : ''),
        start: startVisit,
        end: endVisit,
        rrule: `${frequency};UNTIL=${untilDate}`,
        url: stop.timetable || '',
        latitude: stop.latitude,
        longitude: stop.longitude
      }

      return createCalendar(cal)
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Retrieves Mapbox Vector Tile (MVT) binary buffer for stop points.
   * @param {number|string} x - Tile column.
   * @param {number|string} y - Tile row.
   * @param {number|string} z - Zoom level.
   * @returns {Promise<?Buffer>} Vector tile buffer or null.
   */
  static async getTileData (x, y, z) {
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
}

export const getStops = Stop.getStops
export const getNearestStops = Stop.getNearestStops
export const getStopById = Stop.getStopById
export const getStopPdfById = Stop.getStopPdfById
export const getStopCalendarById = Stop.getStopCalendarById
export const getTileData = Stop.getTileData
export const getViewFields = Stop.getViewFields

export default Stop
