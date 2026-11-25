/**
 * @file Backward compatibility shim for GeoJSON conversion utilities.
 * @module helpers/utils
 */

import { toPointFeatureCollection, toGeometryFeatureCollection } from './geojson.js'

export const convertJsonToGeoJsonPoints = toPointFeatureCollection
export const convertJsonToGeoJsonLines = toGeometryFeatureCollection

export default {
  convertJsonToGeoJsonPoints,
  convertJsonToGeoJsonLines
}
