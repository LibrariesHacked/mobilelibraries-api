const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const schema = require('../models/schema')

const { Parser } = require('json2csv')
const csvtojson = require('csvtojson')

router.get('/', cache(3600), async (req, res) => {
  const schemaData = await schema.getData()
  if (req.accepts('text/csv')) {
    const fields = schema.getViewFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(schemaData))
  } else {
    res.json(schemaData)
  }
})

router.get('/:organisation_name', cache(3600), async (req, res) => {
  const organisationName = req.params.organisation_name
  const schemaData = await schema.getData(organisationName)
  if (req.accepts('text/csv')) {
    const fields = schema.getViewFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(schemaData))
  } else {
    res.json(schemaData)
  }
})

router.post('/', async (req, res) => {
  let csvData = req.body
  if (req.is('text/csv')) {
    csvData = await csvtojson().fromString(req.body)
  }
  await schema.createData(csvData)
  res.status(201).json({ rows: csvData.length })
})

module.exports = router
