/**
 * @file Routes for mobile library routes and frequencies.
 * @module routes/routes
 */

import express from 'express'
import cache from '../middleware/cache.js'
import routeModel from '../models/route.js'

const router = express.Router()

router.get('/', cache(3600), async (req, res, next) => {
  try {
    const localAuthorityId = req.query.local_authority_id || null
    const mobileId = req.query.mobile_id || null

    const routes = await routeModel.getRoutes(localAuthorityId, mobileId)
    res.json(routes)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const route = await routeModel.getRouteById(req.params.id)
    if (route != null) {
      res.status(200).json(route)
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
