const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')

const tripModel = require('../models/trip')

const utils = require('../helpers/utils')

router.get('/', cache(3600), async (req, res) => {
  const trips = await tripModel.getTrips()
  if (req.get('Accept') === 'application/geo+json') {
    res.json(utils.convertJsonToGeoJsonLines(trips, 'route_line'))
  } else {
    res.json(trips)
  }
})

router.get('/:id', cache(3600), async (req, res) => {
  const trip = await tripModel.getTripById(req.params.id)
  if (trip != null) return res.json(trip)
  res.status(404).json({
    errors: [{ status: '404', title: 'Not Found' }]
  })
})

router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  const tile = await tripModel.getTileData(x, y, z)
  res.setHeader('Content-Type', 'application/x-protobuf')
  if (!tile) return res.status(204).send(null)
  res.send(tile)
})

module.exports = router
