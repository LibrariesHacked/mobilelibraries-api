const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const mobileModel = require('../models/mobile')

router.get('/', cache(3600), async (req, res) => {
  if (req.query.organisation_id) {
    const mobiles = await mobileModel.getMobilesByOrganisationId(
      req.query.organisation_id
    )
    res.json(mobiles)
  } else {
    const mobiles = await mobileModel.getMobiles()
    res.json(mobiles)
  }
})

router.get('/locations', cache(30), async (req, res) => {
  const locations = await mobileModel.getMobileLocations()
  res.json(locations)
})

router.get('/nearest', cache(3600), async (req, res) => {
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const distance = req.query.distance || null
  const mobiles = await mobileModel.getMobilesWithinDistance(
    longitude,
    latitude,
    distance
  )
  res.json(mobiles)
})

router.get('/:id', cache(3600), async (req, res) => {
  const mobile = await mobileModel.getMobileById(req.params.id)
  if (mobile != null) {
    res.json(mobile)
  } else {
    res.status(404).json({
      errors: [{ status: '404', title: 'Not Found' }]
    })
  }
})

module.exports = router
