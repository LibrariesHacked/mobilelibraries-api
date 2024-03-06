module.exports.convertJsonToGeoJsonPoints = (
  json,
  longitudeField,
  latitudeField
) => {
  const features = []
  json.forEach(item => {
    if (
      !item[longitudeField] ||
      !item[latitudeField] ||
      item[longitudeField] === '' ||
      item[latitudeField] === ''
    ) {
      return
    } else {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(item[longitudeField]),
            parseFloat(item[latitudeField])
          ]
        },
        properties: item
      }
      features.push(feature)
    }
  })
  return {
    type: 'FeatureCollection',
    features
  }
}

module.exports.convertJsonToGeoJsonLines = (json, lineField) => {
  const features = []
  json.forEach(item => {
    const lineGeom = item[lineField]
    delete item[lineField]
    const feature = {
      type: 'Feature',
      geometry: lineGeom,
      properties: item
    }
    features.push(feature)
  })
  return {
    type: 'FeatureCollection',
    features
  }
}
