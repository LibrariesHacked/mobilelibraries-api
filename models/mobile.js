/**
 * @file Mobile library models: the vehicles themselves, their estimated live
 * locations, and proximity search results.
 * @module models/mobile
 */

import pool from '../helpers/database.js'
import { parseGeometry } from '../helpers/geojson.js'

/**
 * The estimated current position of a mobile library, as exposed by
 * `vw_mobiles_location`.
 */
export class MobileLocation {
  /**
   * Database columns selected from `vw_mobiles_location`.
   * @type {string[]}
   */
  static fields = [
    'mobile_id',
    'current_stop_id',
    'current_stop_departure',
    'current_stop_name',
    'previous_stop_id',
    'previous_stop_departure',
    'previous_stop_name',
    'next_stop_id',
    'next_stop_arrival',
    'next_stop_name',
    'updated',
    'update_type',
    'geox',
    'geoy',
    'route_section'
  ]

  /**
   * Creates a mobile location from a database row.
   * @param {object} row - A row from `vw_mobiles_location`.
   */
  constructor (row) {
    /** @type {number} ID of the mobile library. */
    this.mobile_id = row.mobile_id
    /** @type {?number} Stop the mobile is currently at. */
    this.current_stop_id = row.current_stop_id
    /** @type {?string} Departure time from the current stop. */
    this.current_stop_departure = row.current_stop_departure
    /** @type {?string} Name of the current stop. */
    this.current_stop_name = row.current_stop_name
    /** @type {?number} Last stop visited. */
    this.previous_stop_id = row.previous_stop_id
    /** @type {?string} Departure time from the previous stop. */
    this.previous_stop_departure = row.previous_stop_departure
    /** @type {?string} Name of the previous stop. */
    this.previous_stop_name = row.previous_stop_name
    /** @type {?number} Next stop to be visited. */
    this.next_stop_id = row.next_stop_id
    /** @type {?string} Arrival time at the next stop. */
    this.next_stop_arrival = row.next_stop_arrival
    /** @type {?string} Name of the next stop. */
    this.next_stop_name = row.next_stop_name
    /** @type {?string} When the estimate was last updated. */
    this.updated = row.updated
    /** @type {?string} How the estimate was derived. */
    this.update_type = row.update_type
    /** @type {?number} Estimated longitude. */
    this.geox = row.geox
    /** @type {?number} Estimated latitude. */
    this.geoy = row.geoy
    /** @type {?object} GeoJSON geometry of the route section being travelled. */
    this.route_section = parseGeometry(row.route_section)
  }
}

/**
 * A mobile library that falls within a search distance of a point, as
 * returned by `fn_mobiles_nearest`.
 */
export class NearbyMobile {
  /**
   * Creates a nearby mobile from a database row.
   * @param {object} row - A row from `fn_mobiles_nearest`.
   */
  constructor (row) {
    /** @type {number} ID of the mobile library. */
    this.mobile_id = row.mobile_id
    /** @type {number} ID of the nearest stop on its routes. */
    this.stop_id = row.stop_id
    /** @type {string} Name of the nearest stop. */
    this.stop_name = row.stop_name
    /** @type {number} Distance to the stop in metres. */
    this.stop_distance = row.stop_distance
  }
}

/**
 * A mobile library vehicle, as exposed by `vw_mobiles`.
 */
export class Mobile {
  /**
   * Database columns selected from `vw_mobiles`.
   * @type {string[]}
   */
  static fields = [
    'id',
    'local_authority_id',
    'local_authority_code',
    'name',
    'timetable',
    'number_routes',
    'number_stops'
  ]

  /**
   * Creates a mobile library from a database row.
   * @param {object} row - A row from `vw_mobiles`.
   */
  constructor (row) {
    /** @type {number} Internal identifier. */
    this.id = row.id
    /** @type {number} ID of the operating local authority. */
    this.local_authority_id = row.local_authority_id
    /** @type {string} GSS code of the operating local authority. */
    this.local_authority_code = row.local_authority_code
    /** @type {string} Vehicle name. */
    this.name = row.name
    /** @type {?string} URL of the published timetable. */
    this.timetable = row.timetable
    /** @type {number} Number of routes the vehicle runs. */
    this.number_routes = row.number_routes
    /** @type {number} Number of stops the vehicle serves. */
    this.number_stops = row.number_stops
  }

  /**
   * Gets the list of view field names.
   * @returns {string[]} Field names.
   */
  static getViewFields () {
    return Mobile.fields
  }

  /**
   * Gets the list of location field names.
   * @returns {string[]} Location field names.
   */
  static getViewLocationFields () {
    return MobileLocation.fields
  }

  /**
   * Gets mobile libraries, optionally filtered to one local authority.
   * @param {?(number|string)} [localAuthorityId] - Local authority ID to filter by.
   * @returns {Promise<Mobile[]>} The mobiles ordered by name, or an empty array on error.
   */
  static async getMobiles (localAuthorityId) {
    let query = `select ${Mobile.fields.join(', ')} from vw_mobiles`
    const params = []
    if (localAuthorityId) {
      query += ' where local_authority_id = $1'
      params.push(localAuthorityId)
    }
    query += ' order by name'
    try {
      const { rows } = await pool.query(query, params)
      return rows.map(row => new Mobile(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * Alias for getMobiles filtered by local authority ID.
   * @param {number|string} localAuthorityId - Local authority ID.
   * @returns {Promise<Mobile[]>} The mobiles.
   */
  static async getMobilesByLocalAuthorityId (localAuthorityId) {
    return Mobile.getMobiles(localAuthorityId)
  }

  /**
   * Gets a single mobile library by ID.
   * @param {(number|string)} id - The mobile ID.
   * @returns {Promise<?Mobile>} The mobile, or null if not found.
   */
  static async getMobileById (id) {
    try {
      const query = `select ${Mobile.fields.join(', ')} from vw_mobiles where id = $1`
      const { rows } = await pool.query(query, [id])
      return rows.length > 0 ? new Mobile(rows[0]) : null
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Refreshes and gets the estimated live location of every mobile library.
   * Calls `fn_updates()` first so the estimates reflect the current time.
   * @returns {Promise<MobileLocation[]>} The locations, or an empty array on error.
   */
  static async getMobileLocations () {
    try {
      await pool.query('select fn_updates()')
      const { rows } = await pool.query(
        `select ${MobileLocation.fields.join(', ')} from vw_mobiles_location`
      )
      return rows.map(row => new MobileLocation(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * Gets mobile libraries that stop within a distance of a point.
   * @param {(number|string)} longitude - WGS84 longitude of the point.
   * @param {(number|string)} latitude - WGS84 latitude of the point.
   * @param {(number|string)} distance - Search radius in metres.
   * @returns {Promise<NearbyMobile[]>} The nearby mobiles, or an empty array on error.
   */
  static async getMobilesWithinDistance (longitude, latitude, distance) {
    try {
      const { rows } = await pool.query(
        'select * from fn_mobiles_nearest($1, $2, $3)',
        [longitude, latitude, distance]
      )
      return rows.map(row => new NearbyMobile(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

export const getMobiles = Mobile.getMobiles
export const getMobilesByLocalAuthorityId = Mobile.getMobilesByLocalAuthorityId
export const getMobileById = Mobile.getMobileById
export const getMobileLocations = Mobile.getMobileLocations
export const getMobilesWithinDistance = Mobile.getMobilesWithinDistance
export const getViewFields = Mobile.getViewFields
export const getViewLocationFields = Mobile.getViewLocationFields

export default Mobile
