const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const schema = require('../models/schema')

const { Parser } = require('json2csv')
const csvtojson = require('csvtojson')

router.get('/', cache(3600), function (req, res, next) {
  if (req.accepts('text/csv')) {
    const fields = schema.getViewFields()
    const parser = new Parser({ fields })
    schema.getData().then(data => { res.send(parser.parse(data)) })
  } else {
    schema.getData().then(data => { res.json(data) })
  }
})

router.get('/:organisation_name', cache(3600), function (req, res, next) {
  const organisationName = req.params.organisation_name
  if (req.accepts('text/csv')) {
    const fields = schema.getViewFields()
    const parser = new Parser({ fields })
    schema.getData(organisationName).then(data => { res.send(parser.parse(data)) })
  } else {
    schema.getData(organisationName).then(data => { res.json(data) })
  }
})

router.post('/', function (req, res, next) {
  if (req.is('text/csv')) {
    csvtojson()
      .fromString(req.body)
      .then((schemaArr) => {
        schema.createData(schemaArr).then(() => { res.status(201).json({ rows: schemaArr.length }) })
      })
  } else {
    schema.createData(req.body).then(() => { res.status(201).json({ rows: req.body.length }) })
  }
})

router.put('/:organisation_name', function (req, res, next) {

})

router.delete('/:organisation_name', function (req, res, next) {

})

module.exports = router
