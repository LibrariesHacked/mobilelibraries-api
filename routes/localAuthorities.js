/**
 * @file Routes for local authorities operating mobile libraries.
 * @module routes/localAuthorities
 */

import express from 'express'
import cache from '../middleware/cache.js'
import localAuthorityModel from '../models/localAuthority.js'

const router = express.Router()

router.get('/', cache(3600), async (req, res, next) => {
  try {
    const auths = await localAuthorityModel.getLocalAuthorities()
    res.json(auths)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', cache(3600), async (req, res, next) => {
  try {
    const auth = await localAuthorityModel.getLocalAuthorityById(req.params.id)
    if (auth != null) {
      res.json(auth)
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
