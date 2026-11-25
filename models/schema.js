/**
 * @file Mobile library schema model. Handles import and export of stops data
 * conforming to the UK national standard schema (v2.0.0).
 * @module models/schema
 */

import pool from '../helpers/database.js'

/**
 * A stop record conforming to schema.librarydata.uk/mobile-library-stops.json (v2.0.0).
 */
export class SchemaStop {
  /**
   * Database columns selected from `vw_schema`. `end` is quoted because it is
   * a reserved keyword in PostgreSQL.
   * @type {string[]}
   */
  static viewFields = [
    'local_authority',
    'local_authority_code',
    'mobile_name',
    'route',
    'community',
    'stop',
    'address',
    'postcode',
    'geox',
    'geoy',
    'day',
    'type',
    'arrival',
    'departure',
    'frequency',
    'start',
    '"end"',
    'exceptions',
    'timetable'
  ]

  /**
   * Output field names without quotes.
   * @type {string[]}
   */
  static exportFields = [
    'local_authority',
    'local_authority_code',
    'mobile_name',
    'route',
    'community',
    'stop',
    'address',
    'postcode',
    'geox',
    'geoy',
    'day',
    'type',
    'arrival',
    'departure',
    'frequency',
    'start',
    'end',
    'exceptions',
    'timetable'
  ]

  /**
   * Columns of the `stop_staging` table.
   * @type {string[]}
   */
  static stagingCols = [
    'local_authority',
    'local_authority_code',
    'mobile_name',
    'route',
    'community',
    'stop',
    'address',
    'postcode',
    'geox',
    'geoy',
    'day',
    'type',
    'arrival',
    'departure',
    'frequency',
    '"start"',
    '"end"',
    'exceptions',
    'timetable'
  ]

  /**
   * Creates a SchemaStop instance from a database row.
   * @param {object} row - Database row or CSV object.
   */
  constructor (row) {
    this.local_authority = row.local_authority ?? null
    this.local_authority_code = row.local_authority_code ?? null
    this.mobile_name = row.mobile_name ?? null
    this.route = row.route ?? null
    this.community = row.community ?? null
    this.stop = row.stop ?? null
    this.address = row.address ?? null
    this.postcode = row.postcode ?? null
    this.geox = row.geox != null ? Number(row.geox) : null
    this.geoy = row.geoy != null ? Number(row.geoy) : null
    this.day = row.day ?? null
    this.type = row.type ?? 'Public'
    this.arrival = row.arrival ?? null
    this.departure = row.departure ?? null
    this.frequency = row.frequency ?? null
    this.start = row.start ?? null
    this.end = row.end ?? null
    this.exceptions = row.exceptions ?? null
    this.timetable = row.timetable ?? null
  }

  /**
   * Gets the list of export field names.
   * @returns {string[]} Export field names.
   */
  static getViewFields () {
    return SchemaStop.exportFields
  }

  /**
   * Gets schema stop records, optionally filtered by authority name or GSS code.
   * @param {?string} [localAuthority] - Local authority name or GSS code.
   * @returns {Promise<SchemaStop[]>} Stop records ordered by authority, mobile, route, day, arrival.
   */
  static async getData (localAuthority) {
    let schemaData = []
    try {
      let query = `select ${SchemaStop.viewFields.join(', ')} from vw_schema`
      const params = []
      if (localAuthority) {
        query += ' where local_authority = $1 or local_authority_code = $1'
        params.push(localAuthority)
      }
      query += ' order by local_authority, mobile_name, route, day, arrival'
      const { rows } = await pool.query(query, params)
      schemaData = rows.map(r => new SchemaStop(r))
    } catch (e) {
      console.error(e)
    }
    return schemaData
  }

  /**
   * Bulk inserts stops into `stop_staging` and triggers database ingestion functions.
   * @param {object[]} schemadata - Array of raw stop objects.
   * @returns {Promise<void>}
   */
  static async createData (schemadata) {
    if (!schemadata || !Array.isArray(schemadata) || schemadata.length === 0) {
      return
    }

    const distinctAuthorities = new Set()

    try {
      const batchSize = 500
      for (let b = 0; b < schemadata.length; b += batchSize) {
        const chunk = schemadata.slice(b, b + batchSize)
        const params = []
        const inserts = []
        let index = 0

        chunk.forEach(row => {
          const getVal = (...keys) => {
            for (const k of keys) {
              if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
                return row[k]
              }
            }
            return null
          }

          const la = getVal('local_authority', 'Local authority')
          const laCode = getVal('local_authority_code', 'Local authority code')
          const mobile = getVal('mobile_name', 'Mobile name')
          const route = getVal('route', 'Route')
          const community = getVal('community', 'Community')
          const stop = getVal('stop', 'Stop', 'name', 'Name')
          const address = getVal('address', 'Address')
          const postcode = getVal('postcode', 'Postcode')
          const geox = getVal('geox', 'GeoX', 'longitude', 'Longitude')
          const geoy = getVal('geoy', 'GeoY', 'latitude', 'Latitude')
          const day = getVal('day', 'Day')
          const type = getVal('type', 'Type') || 'Public'
          const arrival = getVal('arrival', 'Arrival')
          const departure = getVal('departure', 'Departure')
          const frequency = getVal('frequency', 'Frequency')
          const start = getVal('start', 'Start')
          const end = getVal('end', 'End')
          const exceptions = getVal('exceptions', 'Exceptions')
          const timetable = getVal('timetable', 'Timetable')

          if (la) distinctAuthorities.add(la)
          if (laCode) distinctAuthorities.add(laCode)

          const rowValues = [
            la,
            laCode,
            mobile,
            route,
            community,
            stop,
            address,
            postcode,
            geox ? Number(geox) : null,
            geoy ? Number(geoy) : null,
            day,
            type,
            arrival,
            departure,
            frequency,
            start,
            end,
            exceptions,
            timetable
          ]

          const placeholders = []
          rowValues.forEach(val => {
            index++
            placeholders.push('$' + index)
            params.push(val)
          })
          inserts.push('(' + placeholders.join(', ') + ')')
        })

        const query = `insert into stop_staging (${SchemaStop.stagingCols.join(', ')}) values ${inserts.join(', ')}`
        await pool.query(query, params)
      }

      for (const auth of distinctAuthorities) {
        await pool.query('select fn_load_stops_staging($1)', [auth])
      }

      await pool.query('select fn_updates()')
    } catch (e) {
      console.error('Error in createData:', e)
      throw e
    }
  }
}

export const getData = SchemaStop.getData
export const createData = SchemaStop.createData
export const getViewFields = SchemaStop.getViewFields

export default SchemaStop
