/**
 * @file Routes for mobile library stops, PDF flyers, iCalendar visit timetables, and vector tiles.
 * @module routes/stops
 */

import express from 'express'
import cache from '../middleware/cache.js'
import stopModel from '../models/stop.js'
import { toPointFeatureCollection } from '../helpers/geojson.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const localAuthorityIds =
      req.query.local_authority_ids ||
      req.query.local_authority_id ||
      null

    const localAuthorityCodes =
      req.query.local_authority_codes ||
      req.query.local_authority_code ||
      null

    const mobileIds = req.query.mobile_ids || req.query.mobile_id || null
    const routeIds = req.query.route_ids || req.query.route_id || null
    const longitude = req.query.longitude || null
    const latitude = req.query.latitude || null
    const distance = req.query.distance || null
    const limit = req.query.limit || 1000
    const page = req.query.page || 1
    const sort = req.query.sort || 'id'
    const direction = req.query.direction || 'asc'

    let stops = await stopModel.getStops(
      localAuthorityIds,
      mobileIds,
      routeIds,
      localAuthorityCodes,
      longitude,
      latitude,
      distance,
      limit,
      page,
      sort,
      direction
    )

    if (stops == null || stops.length === 0) {
      return res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
    }

    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page')
    res.setHeader('X-Total-Count', stops.length > 0 ? (stops[0].total ?? stops.length) : 0)
    res.setHeader('X-Page', page)
    stops = stops.map(({ total, ...stop }) => stop)

    if (req.get('Accept') === 'application/geo+json') {
      stops = stops.map(stop => {
        const flatStop = { ...stop }
        Object.keys(flatStop).forEach(key => {
          if (Array.isArray(flatStop[key])) {
            flatStop[key] = flatStop[key].join(',')
          }
        })
        return flatStop
      })
      res.json(toPointFeatureCollection(stops, 'longitude', 'latitude'))
    } else {
      res.json(stops)
    }
  } catch (err) {
    next(err)
  }
})

router.get('/nearest', async (req, res, next) => {
  try {
    const longitude = req.query.longitude || null
    const latitude = req.query.latitude || null
    const limit = req.query.limit || 1

    const stops = await stopModel.getNearestStops(longitude, latitude, limit)
    if (stops == null || stops.length === 0) {
      res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
    } else {
      res.json(stops)
    }
  } catch (err) {
    next(err)
  }
})

router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const stop = await stopModel.getStopById(req.params.id)
    if (stop != null) return res.json(stop)
    res.status(404).json({
      errors: [{ status: '404', title: 'Not Found' }]
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/pdf', cache(3600), async (req, res, next) => {
  try {
    const pdfBuffer = await stopModel.getStopPdfById(req.params.id)
    if (!pdfBuffer) {
      return res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
    }
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.id}.pdf`)
    res.send(pdfBuffer)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/ics', cache(3600), async (req, res, next) => {
  try {
    const calendar = await stopModel.getStopCalendarById(req.params.id)
    if (!calendar) {
      return res.status(404).json({ errors: [{ status: '404', title: 'Not Found' }] })
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.id}.ics`)
    res.send(calendar)
  } catch (err) {
    next(err)
  }
})

router.get('/:z/:x/:y.mvt', cache(3600), async (req, res, next) => {
  try {
    const { z, x, y } = req.params
    const tile = await stopModel.getTileData(x, y, z)
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (!tile) return res.status(204).send(null)
    res.send(tile)
  } catch (err) {
    next(err)
  }
})

export default router
