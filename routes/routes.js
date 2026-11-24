const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const routeModel = require('../models/route')

router.get('/', cache(3600), async (req, res) => {
  const localAuthorityId = req.query.local_authority_id || null
  const mobileId = req.query.mobile_id || null

  const routes = await routeModel.getRoutes(localAuthorityId, mobileId)
  res.json(routes)
})

router.get('/:id', cache(3600), async (req, res) => {
  const route = await routeModel.getRouteById(req.params.id)
  if (route != null) {
    res.status(200).json(route)
  } else {
    res.status(404).json({
      errors: [{ status: '404', title: 'Not Found' }]
    })
  }
})

module.exports = router
