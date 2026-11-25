/**
 * @file Trip model. A trip is the journey a mobile library makes between two
 * consecutive stops.
 * @module models/trip
 */

import pool from '../helpers/database.js'
import { parseGeometry } from '../helpers/geojson.js'

/**
 * A journey between two consecutive stops, as exposed by `vw_trips`.
 */
export class Trip {
  /**
   * Database columns selected from `vw_trips`.
   * @type {string[]}
   */
  static fields = [
    'id',
    'origin_stop_id',
    'origin_stop_name',
    'destination_stop_id',
    'destination_stop_name',
    'distance',
    'duration',
    'route_line'
  ]

  /**
   * Creates a trip from a database row.
   * @param {object} row - A row from `vw_trips`.
   */
  constructor (row) {
    /** @type {number} Internal identifier. */
    this.id = row.id
    /** @type {number} ID of the stop the trip starts at. */
    this.origin_stop_id = row.origin_stop_id
    /** @type {string} Name of the stop the trip starts at. */
    this.origin_stop_name = row.origin_stop_name
    /** @type {number} ID of the stop the trip ends at. */
    this.destination_stop_id = row.destination_stop_id
    /** @type {string} Name of the stop the trip ends at. */
    this.destination_stop_name = row.destination_stop_name
    /** @type {?number} Distance travelled in metres. */
    this.distance = row.distance
    /** @type {?number} Travel time in seconds. */
    this.duration = row.duration
    /** @type {?object} GeoJSON LineString of the path travelled. */
    this.route_line = parseGeometry(row.route_line)
  }

  /**
   * Gets the list of view field names.
   * @returns {string[]} Field names.
   */
  static getViewFields () {
    return Trip.fields
  }

  /**
   * Gets all trips.
   * @returns {Promise<Trip[]>} The trips, or an empty array on error.
   */
  static async getTrips () {
    try {
      const { rows } = await pool.query(`select ${Trip.fields.join(', ')} from vw_trips`)
      return rows.map(row => new Trip(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * Gets a single trip by ID.
   * @param {(number|string)} id - The trip ID.
   * @returns {Promise<?Trip>} The trip, or null if not found.
   */
  static async getTripById (id) {
    try {
      const query = `select ${Trip.fields.join(', ')} from vw_trips where id = $1`
      const { rows } = await pool.query(query, [id])
      return rows.length > 0 ? new Trip(rows[0]) : null
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Gets a Mapbox Vector Tile of trip lines.
   * @param {(number|string)} x - Tile column.
   * @param {(number|string)} y - Tile row.
   * @param {(number|string)} z - Zoom level.
   * @returns {Promise<?Buffer>} The tile, or null if empty or on error.
   */
  static async getTileData (x, y, z) {
    try {
      const { rows } = await pool.query('select fn_trips_mvt($1, $2, $3)', [x, y, z])
      return rows.length > 0 && rows[0].fn_trips_mvt ? rows[0].fn_trips_mvt : null
    } catch (e) {
      console.error(e)
      return null
    }
  }
}

export const getTrips = Trip.getTrips
export const getTripById = Trip.getTripById
export const getTileData = Trip.getTileData
export const getViewFields = Trip.getViewFields

export default Trip
