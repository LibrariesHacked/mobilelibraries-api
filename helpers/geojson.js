/**
 * @file Converts arrays of records to GeoJSON (RFC 7946) feature collections.
 * @module helpers/geojson
 */

/**
 * A GeoJSON feature collection.
 * @typedef {object} FeatureCollection
 * @property {'FeatureCollection'} type - Always `FeatureCollection`.
 * @property {Array<{type: 'Feature', geometry: object, properties: object}>} features - The features.
 */

/**
 * Converts records with coordinate fields into a collection of Point
 * features. Records without valid coordinates are skipped.
 * @param {object[]} records - The records to convert.
 * @param {string} longitudeField - Name of the longitude property.
 * @param {string} latitudeField - Name of the latitude property.
 * @returns {FeatureCollection} The feature collection. Each record becomes the feature's properties.
 */
export const toPointFeatureCollection = (records, longitudeField, latitudeField) => ({
  type: 'FeatureCollection',
  features: (Array.isArray(records) ? records : []).flatMap(record => {
    const rawLongitude = record[longitudeField]
    const rawLatitude = record[latitudeField]
    if (rawLongitude == null || rawLatitude == null || rawLongitude === '' || rawLatitude === '') return []
    const longitude = Number(rawLongitude)
    const latitude = Number(rawLatitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return []
    return [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: { ...record }
    }]
  })
})

/**
 * Converts records that hold a GeoJSON geometry into a feature collection.
 * The geometry is removed from the properties. Records without a valid
 * geometry are skipped.
 * @param {object[]} records - The records to convert.
 * @param {string} geometryField - Name of the property holding the geometry, as an object or JSON string.
 * @returns {FeatureCollection} The feature collection.
 */
export const toGeometryFeatureCollection = (records, geometryField) => ({
  type: 'FeatureCollection',
  features: (Array.isArray(records) ? records : []).flatMap(record => {
    const { [geometryField]: rawGeometry, ...properties } = record
    const geometry = parseGeometry(rawGeometry)
    return geometry ? [{ type: 'Feature', geometry, properties }] : []
  })
})

/**
 * Parses a GeoJSON geometry that may be stored as a JSON string.
 * @param {(string | object | null | undefined)} value - The raw geometry.
 * @returns {?object} The geometry object, or null if missing or unparseable.
 */
export const parseGeometry = value => {
  if (typeof value !== 'string') return value ?? null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
