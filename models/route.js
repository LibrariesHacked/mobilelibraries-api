/**
 * @file Route model. A route is a recurring sequence of stops run by one
 * mobile library.
 * @module models/route
 */

import pool from '../helpers/database.js'

/**
 * A mobile library route, as exposed by `vw_routes`.
 */
export class Route {
  /**
   * Database columns selected from `vw_routes`. `start` and `end` are quoted
   * because they are reserved words in PostgreSQL.
   * @type {string[]}
   */
  static fields = [
    'id',
    'local_authority_id',
    'local_authority_code',
    'mobile_id',
    'name',
    'frequency',
    '"start"',
    '"end"',
    'timetable',
    'number_stops'
  ]

  /**
   * Creates a route from a database row.
   * @param {object} row - A row from `vw_routes`.
   */
  constructor (row) {
    /** @type {number} Internal identifier. */
    this.id = row.id
    /** @type {number} ID of the operating local authority. */
    this.local_authority_id = row.local_authority_id
    /** @type {string} GSS code of the operating local authority. */
    this.local_authority_code = row.local_authority_code
    /** @type {number} ID of the mobile library that runs the route. */
    this.mobile_id = row.mobile_id
    /** @type {string} Route name. */
    this.name = row.name
    /** @type {?string} iCalendar RRULE describing how often the route runs. */
    this.frequency = row.frequency
    /** @type {?string} Date the route schedule starts. */
    this.start = row.start
    /** @type {?string} Date the route schedule ends. */
    this.end = row.end
    /** @type {?string} URL of the published timetable. */
    this.timetable = row.timetable
    /** @type {number} Number of stops on the route. */
    this.number_stops = row.number_stops
  }

  /**
   * Gets the list of view field names.
   * @returns {string[]} Field names.
   */
  static getViewFields () {
    return Route.fields
  }

  /**
   * Gets routes, optionally filtered by local authority and/or mobile.
   * @param {?(number|string)} [localAuthorityId] - Local authority ID to filter by.
   * @param {?(number|string)} [mobileId] - Mobile ID to filter by.
   * @returns {Promise<Route[]>} The routes ordered by name, or an empty array on error.
   */
  static async getRoutes (localAuthorityId, mobileId) {
    const whereQueries = []
    const params = []

    if (localAuthorityId) {
      params.push(localAuthorityId)
      whereQueries.push(`local_authority_id = $${params.length}`)
    }

    if (mobileId) {
      params.push(mobileId)
      whereQueries.push(`mobile_id = $${params.length}`)
    }

    let query = `select ${Route.fields.join(', ')} from vw_routes`
    if (whereQueries.length > 0) {
      query += ' where ' + whereQueries.join(' and ')
    }
    query += ' order by name'

    try {
      const { rows } = await pool.query(query, params)
      return rows.map(row => new Route(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * Gets a single route by ID.
   * @param {(number|string)} id - The route ID.
   * @returns {Promise<?Route>} The route, or null if not found.
   */
  static async getRouteById (id) {
    try {
      const query = `select ${Route.fields.join(', ')} from vw_routes where id = $1`
      const { rows } = await pool.query(query, [id])
      return rows.length > 0 ? new Route(rows[0]) : null
    } catch (e) {
      console.error(e)
      return null
    }
  }
}

export const getRoutes = Route.getRoutes
export const getRouteById = Route.getRouteById
export const getViewFields = Route.getViewFields

export default Route
