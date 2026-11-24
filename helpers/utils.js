module.exports.convertJsonToGeoJsonPoints = (
  json,
  longitudeField,
  latitudeField
) => {
  const features = []
  if (!json || !Array.isArray(json)) return { type: 'FeatureCollection', features }

  json.forEach(item => {
    if (
      item[longitudeField] === null ||
      item[longitudeField] === undefined ||
      item[latitudeField] === null ||
      item[latitudeField] === undefined ||
      item[longitudeField] === '' ||
      item[latitudeField] === ''
    ) {
      return
    }
    const lon = parseFloat(item[longitudeField])
    const lat = parseFloat(item[latitudeField])
    if (isNaN(lon) || isNaN(lat)) return

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: { ...item }
    })
  })

  return {
    type: 'FeatureCollection',
    features
  }
}

module.exports.convertJsonToGeoJsonLines = (json, lineField) => {
  const features = []
  if (!json || !Array.isArray(json)) return { type: 'FeatureCollection', features }

  json.forEach(item => {
    const { [lineField]: rawGeom, ...properties } = item
    let geometry = rawGeom
    if (typeof geometry === 'string') {
      try {
        geometry = JSON.parse(geometry)
      } catch (e) {
        geometry = null
      }
    }
    if (geometry) {
      features.push({
        type: 'Feature',
        geometry,
        properties
      })
    }
  })

  return {
    type: 'FeatureCollection',
    features
  }
}
