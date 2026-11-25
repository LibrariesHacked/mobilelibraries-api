/**
 * @file Routes for driving trips between consecutive stops.
 * @module routes/trips
 */

import express from 'express'
import cache from '../middleware/cache.js'
import tripModel from '../models/trip.js'
import { toGeometryFeatureCollection } from '../helpers/geojson.js'

const router = express.Router()

router.get('/', cache(3600), async (req, res, next) => {
  try {
    const trips = await tripModel.getTrips()
    if (req.get('Accept') === 'application/geo+json') {
      res.json(toGeometryFeatureCollection(trips, 'route_line'))
    } else {
      res.json(trips)
    }
  } catch (err) {
    next(err)
  }
})

router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const trip = await tripModel.getTripById(req.params.id)
    if (trip != null) return res.json(trip)
    res.status(404).json({
      errors: [{ status: '404', title: 'Not Found' }]
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:z/:x/:y.mvt', cache(3600), async (req, res, next) => {
  try {
    const { z, x, y } = req.params
    const tile = await tripModel.getTileData(x, y, z)
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (!tile) return res.status(204).send(null)
    res.send(tile)
  } catch (err) {
    next(err)
  }
})

export default router
