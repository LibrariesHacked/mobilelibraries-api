const express = require('express')
const router = express.Router()

const cache = require('../middleware/cache')

const stopModel = require('../models/stop')

const utils = require('../helpers/utils')

router.get('/', async function (req, res, next) {
  const organisationIds = req.query.organisation_ids || null
  const mobileIds = req.query.mobile_ids || null
  const routeIds = req.query.route_ids || null
  const serviceCodes = req.query.service_codes || null
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const distance = req.query.distance || 1
  const limit = req.query.limit || 1000
  const page = req.query.page || 1
  const sort = req.query.sort || 'id'
  const direction = req.query.direction || 'asc'

  let stops = await stopModel.getStops(
    organisationIds,
    mobileIds,
    routeIds,
    serviceCodes,
    longitude,
    latitude,
    distance,
    limit,
    page,
    sort,
    direction
  )

  if (stops == null || stops.length === 0) {
    res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
  } else {
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page')
    res.setHeader('X-Total-Count', stops.length > 0 ? stops[0].total : 0)
    res.setHeader('X-Page', page)
    stops = stops.map(({ total, ...stop }) => stop) // Remove total column

    if (req.get('Accept') === 'application/geo+json') {
      // Flatten the stops array so that all array properties are strings
      stops = stops.map(stop => {
        const flatStop = { ...stop }
        Object.keys(flatStop).forEach(key => {
          if (Array.isArray(flatStop[key])) {
            flatStop[key] = flatStop[key].join(',')
          }
        })
        return flatStop
      })
      res.json(utils.convertJsonToGeoJsonPoints(stops, 'longitude', 'latitude'))
    } else {
      res.json(stops)
    }
  }
})

router.get('/nearest', function (req, res, next) {
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const limit = req.query.limit || 1

  stopModel.getNearestStops(longitude, latitude, limit).then(stops => {
    if (stops == null || stops.length === 0) {
      res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
    } else {
      res.json(stops)
    }
  })
})

router.get('/:id', cache(3600), function (req, res, next) {
  stopModel.getStopById(req.params.id).then(stop => {
    if (stop != null) return res.json(stop)
    res.status(404).json({
      errors: [{ status: '404', title: 'Not Found' }]
    })
  })
})

router.get('/:id/pdf', cache(3600), function (req, res, next) {
  stopModel.getStopPdfById(req.params.id).then(doc => {
    res.setHeader('Content-type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + req.params.id + '.pdf'
    )
    const chunks = []
    let result

    doc.on('data', function (chunk) {
      chunks.push(chunk)
    })

    doc.on('end', function () {
      result = Buffer.concat(chunks)
      res.send(result)
    })

    doc.end()
  })
})

router.get('/:id/ics', cache(3600), function (req, res, next) {
  stopModel.getStopCalendarById(req.params.id).then(calendar => {
    res.setHeader('Content-type', 'text/calendar')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + req.params.id + '.ics'
    )
    res.send(calendar)
    res.end()
  })
})

router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  stopModel.getTileData(x, y, z).then(tile => {
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (!tile) return res.status(204).send(null)
    res.send(tile)
  })
})

module.exports = router
