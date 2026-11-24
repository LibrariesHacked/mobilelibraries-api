const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const localAuthorityModel = require('../models/localAuthority')

router.get('/', cache(3600), async (req, res) => {
  try {
    const auths = await localAuthorityModel.getLocalAuthorities()
    res.json(auths)
  } catch (err) {
    res.status(500).json({ errors: [{ status: '500', title: 'Internal Server Error' }] })
  }
})

router.get('/:id', cache(3600), async (req, res) => {
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
    res.status(500).json({ errors: [{ status: '500', title: 'Internal Server Error' }] })
  }
})

module.exports = router
