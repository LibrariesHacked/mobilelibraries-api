/**
 * @file Local authority model. A local authority is the library service
 * that operates one or more mobile libraries.
 * @module models/localAuthority
 */

import pool from '../helpers/database.js'

/** Matches a 9-character GSS code such as `S12000041`. */
const GSS_CODE_PATTERN = /^[A-Za-z][0-9]{8}$/

/**
 * A local authority library service, as exposed by `vw_local_authorities`.
 */
export class LocalAuthority {
  /**
   * Database columns selected from `vw_local_authorities`.
   * @type {string[]}
   */
  static fields = [
    'id',
    'country',
    'local_authority_code',
    'name',
    'timetable',
    'website',
    'email',
    'colour',
    'logo',
    'number_mobiles',
    'number_routes',
    'number_stops'
  ]

  /**
   * Creates a local authority from a database row.
   * @param {object} row - A row from `vw_local_authorities`.
   */
  constructor (row) {
    /** @type {number} Internal identifier. */
    this.id = row.id
    /** @type {string} Country (e.g. England, Scotland, Wales). */
    this.country = row.country
    /** @type {string} 9-character GSS code. */
    this.local_authority_code = row.local_authority_code
    /** @type {string} Authority name. */
    this.name = row.name
    /** @type {?string} URL of the published timetable. */
    this.timetable = row.timetable
    /** @type {?string} Library service website. */
    this.website = row.website
    /** @type {?string} Contact email address. */
    this.email = row.email
    /** @type {?string} Brand colour as a hex string. */
    this.colour = row.colour
    /** @type {?string} Logo URL. */
    this.logo = row.logo
    /** @type {number} Number of mobile libraries operated. */
    this.number_mobiles = row.number_mobiles
    /** @type {number} Number of routes operated. */
    this.number_routes = row.number_routes
    /** @type {number} Number of stops served. */
    this.number_stops = row.number_stops
  }

  /**
   * Gets the list of view field names.
   * @returns {string[]} Field names.
   */
  static getViewFields () {
    return LocalAuthority.fields
  }

  /**
   * Gets all local authorities, ordered by name.
   * @returns {Promise<LocalAuthority[]>} The local authorities, or an empty array on error.
   */
  static async getLocalAuthorities () {
    try {
      const { rows } = await pool.query(
        `select ${LocalAuthority.fields.join(', ')} from vw_local_authorities order by name`
      )
      return rows.map(row => new LocalAuthority(row))
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /**
   * Gets a single local authority by internal ID or GSS code.
   * @param {(number|string)} id - Numeric ID, or a 9-character GSS code.
   * @returns {Promise<?LocalAuthority>} The local authority, or null if not found.
   */
  static async getLocalAuthorityById (id) {
    try {
      const isCode = typeof id === 'string' && GSS_CODE_PATTERN.test(id.trim())
      const column = isCode ? 'local_authority_code' : 'id'
      const query = `select ${LocalAuthority.fields.join(', ')} from vw_local_authorities where ${column} = $1`
      const { rows } = await pool.query(query, [isCode ? id.trim() : id])
      return rows.length > 0 ? new LocalAuthority(rows[0]) : null
    } catch (e) {
      console.error(e)
      return null
    }
  }
}

export const getLocalAuthorities = LocalAuthority.getLocalAuthorities
export const getLocalAuthorityById = LocalAuthority.getLocalAuthorityById
export const getViewFields = LocalAuthority.getViewFields

export default LocalAuthority
