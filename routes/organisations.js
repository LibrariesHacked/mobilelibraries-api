const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const organisation = require('../models/organisation')

router.get('/', cache(3600), function (req, res, next) {
  organisation.getOrganisations().then(orgs => {
    res.json(orgs)
  })
})

router.get('/:id', cache(3600), function (req, res, next) {
  organisation.getOrganisationById(req.params.id).then(org => {
    if (org != null) {
      res.json(org)
    } else {
      res.status(404).json({
        errors: [{ status: '404', title: 'Not Found' }]
      })
    }
  })
})

module.exports = router
