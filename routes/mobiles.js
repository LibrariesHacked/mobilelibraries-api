/**
 * @file Routes for mobile library vehicles, their locations, and nearest stops.
 * @module routes/mobiles
 */

import express from 'express'
import cache from '../middleware/cache.js'
import mobileModel from '../models/mobile.js'

const router = express.Router()

router.get('/', cache(3600), async (req, res, next) => {
  try {
    const localAuthorityId = req.query.local_authority_id || null
    const mobiles = await mobileModel.getMobiles(localAuthorityId)
    res.json(mobiles)
  } catch (err) {
    next(err)
  }
})

router.get('/locations', cache(30), async (req, res, next) => {
  try {
    const locations = await mobileModel.getMobileLocations()
    res.json(locations)
  } catch (err) {
    next(err)
  }
})

router.get('/nearest', cache(3600), async (req, res, next) => {
  try {
    const longitude = req.query.longitude || null
    const latitude = req.query.latitude || null
    const distance = req.query.distance || null
    const mobiles = await mobileModel.getMobilesWithinDistance(
      longitude,
      latitude,
      distance
    )
    res.json(mobiles)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const mobile = await mobileModel.getMobileById(req.params.id)
    if (mobile != null) {
      res.json(mobile)
    } else {
      res.status(404).json({
        errors: [{ status: '404', title: 'Not Found' }]
      })
    }
  } catch (err) {
    next(err)
  }
})

export default router
