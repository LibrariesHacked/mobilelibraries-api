const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const schema = require('../models/schema')

const { Parser } = require('json2csv')
const csvtojson = require('csvtojson')

router.get('/', cache(3600), async (req, res) => {
  try {
    const schemaData = await schema.getData()
    const prefersCsv =
      req.query.format === 'csv' || req.get('Accept') === 'text/csv'

    if (prefersCsv) {
      const fields = schema.getViewFields()
      const parser = new Parser({ fields })
      res.setHeader('Content-Type', 'text/csv')
      res.send(parser.parse(schemaData))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.json(schemaData)
    }
  } catch (err) {
    res
      .status(500)
      .json({ errors: [{ status: '500', title: 'Internal Server Error' }] })
  }
})

router.get('/:local_authority', cache(3600), async (req, res) => {
  try {
    const localAuthority = req.params.local_authority
    const schemaData = await schema.getData(localAuthority)
    const prefersCsv =
      req.query.format === 'csv' || req.get('Accept') === 'text/csv'

    if (prefersCsv) {
      const fields = schema.getViewFields()
      const parser = new Parser({ fields })
      res.setHeader('Content-Type', 'text/csv')
      res.send(parser.parse(schemaData))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.json(schemaData)
    }
  } catch (err) {
    res
      .status(500)
      .json({ errors: [{ status: '500', title: 'Internal Server Error' }] })
  }
})

router.post('/', async (req, res) => {
  try {
    let stopData = req.body
    if (req.is('text/csv') || typeof req.body === 'string') {
      stopData = await csvtojson().fromString(req.body)
    }
    if (!Array.isArray(stopData)) {
      return res.status(400).json({
        errors: [
          {
            status: '400',
            title: 'Bad Request',
            detail: 'Expected JSON array or CSV text'
          }
        ]
      })
    }
    await schema.createData(stopData)
    res.status(201).json({ rows: stopData.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      errors: [
        {
          status: '500',
          title: 'Error processing schema data',
          detail: err.message
        }
      ]
    })
  }
})

module.exports = router
