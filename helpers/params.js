/**
 * @file Parsing and validation for request query and path parameters.
 * Each parser returns `undefined` for a missing value and throws a 400
 * {@link HttpError} for a value that is present but invalid.
 * @module helpers/params
 */

import { HttpError } from './errors.js'

/**
 * Normalises a query value. Repeated query keys arrive as arrays, so those
 * are joined with the pipe separator used by list parameters.
 * @param {unknown} value - The raw value.
 * @returns {(string|undefined)} The trimmed string, or undefined if empty.
 */
const normalise = value => {
  const text = Array.isArray(value) ? value.join('|') : value
  if (text === undefined || text === null) return undefined
  const trimmed = String(text).trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Parses an integer parameter.
 * @param {unknown} value - The raw value.
 * @param {string} name - Parameter name, used in error messages.
 * @param {{min?: number, max?: number}} [range] - Inclusive bounds.
 * @returns {(number|undefined)} The integer, or undefined if missing.
 * @throws {HttpError} If the value is not an integer within range.
 */
export const parseInteger = (value, name, { min = -Infinity, max = Infinity } = {}) => {
  const text = normalise(value)
  if (text === undefined) return undefined
  const number = Number(text)
  if (!Number.isInteger(number) || number < min || number > max) {
    const bounds = [Number.isFinite(min) && `>= ${min}`, Number.isFinite(max) && `<= ${max}`]
      .filter(Boolean)
      .join(' and ')
    throw HttpError.badRequest(`${name} must be an integer${bounds ? ` ${bounds}` : ''}`)
  }
  return number
}

/**
 * Parses a decimal number parameter.
 * @param {unknown} value - The raw value.
 * @param {string} name - Parameter name, used in error messages.
 * @param {{min?: number, max?: number}} [range] - Inclusive bounds.
 * @returns {(number|undefined)} The number, or undefined if missing.
 * @throws {HttpError} If the value is not a finite number within range.
 */
export const parseNumber = (value, name, { min = -Infinity, max = Infinity } = {}) => {
  const text = normalise(value)
  if (text === undefined) return undefined
  const number = Number(text)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw HttpError.badRequest(`${name} must be a number between ${min} and ${max}`)
  }
  return number
}

/**
 * Parses a pipe-separated list of integers, such as `44|56`.
 * @param {unknown} value - The raw value.
 * @param {string} name - Parameter name, used in error messages.
 * @returns {number[]} The integers, or an empty array if missing.
 * @throws {HttpError} If any item is not an integer.
 */
export const parseIntegerList = (value, name) =>
  parseStringList(value).map(item => parseInteger(item, name))

/**
 * Parses a pipe-separated list of strings, such as `S12000041|E06000004`.
 * @param {unknown} value - The raw value.
 * @returns {string[]} The non-empty items, or an empty array if missing.
 */
export const parseStringList = value =>
  (normalise(value) ?? '')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)

/**
 * Parses a WGS84 longitude.
 * @param {unknown} value - The raw value.
 * @returns {(number|undefined)} The longitude, or undefined if missing.
 */
export const parseLongitude = value => parseNumber(value, 'longitude', { min: -180, max: 180 })

/**
 * Parses a WGS84 latitude.
 * @param {unknown} value - The raw value.
 * @returns {(number|undefined)} The latitude, or undefined if missing.
 */
export const parseLatitude = value => parseNumber(value, 'latitude', { min: -90, max: 90 })

/**
 * Parses a positive integer path ID, which is required.
 * @param {unknown} value - The raw value.
 * @param {string} [name] - Parameter name, used in error messages.
 * @returns {number} The ID.
 * @throws {HttpError} If the ID is missing or not a positive integer.
 */
export const parseId = (value, name = 'id') => {
  const id = parseInteger(value, name, { min: 1 })
  if (id === undefined) throw HttpError.badRequest(`${name} is required`)
  return id
}

/**
 * Parses the z/x/y coordinates of a map tile.
 * @param {{z: string, x: string, y: string}} params - The route path parameters.
 * @returns {{z: number, x: number, y: number}} The tile coordinates.
 * @throws {HttpError} If any coordinate is invalid for the zoom level.
 */
export const parseTile = ({ z, x, y }) => {
  const zoom = parseInteger(z, 'z', { min: 0, max: 22 })
  if (zoom === undefined) throw HttpError.badRequest('z is required')
  const max = 2 ** zoom - 1
  const column = parseInteger(x, 'x', { min: 0, max })
  const row = parseInteger(y, 'y', { min: 0, max })
  if (column === undefined || row === undefined) throw HttpError.badRequest('x and y are required')
  return { z: zoom, x: column, y: row }
}

/**
 * Requires that a set of already-parsed parameters were all provided.
 * @param {Record<string, unknown>} values - Parameter values keyed by name.
 * @throws {HttpError} If any value is undefined.
 */
export const requireParams = values => {
  const missing = Object.entries(values)
    .filter(([, value]) => value === undefined)
    .map(([name]) => name)
  if (missing.length > 0) {
    throw HttpError.badRequest(`Missing required parameter(s): ${missing.join(', ')}`)
  }
}
