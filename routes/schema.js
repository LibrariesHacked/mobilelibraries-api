/**
 * @file Routes for schema import and export conforming to schema.librarydata.uk/mobile-library-stops.json (v2.0.0).
 * @module routes/schema
 */

import express from 'express'
import { Parser } from '@json2csv/plainjs'
import { parse as parseCsv } from 'csv-parse/sync'
import cache from '../middleware/cache.js'
import schemaModel from '../models/schema.js'

const router = express.Router()

router.get('/', cache(3600), async (req, res, next) => {
  try {
    const schemaData = await schemaModel.getData()
    const prefersCsv =
      req.query.format === 'csv' || req.get('Accept') === 'text/csv'

    if (prefersCsv) {
      const fields = schemaModel.getViewFields()
      const parser = new Parser({ fields })
      res.setHeader('Content-Type', 'text/csv')
      res.send(parser.parse(schemaData))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.json(schemaData)
    }
  } catch (err) {
    next(err)
  }
})

router.get('/:local_authority', cache(3600), async (req, res, next) => {
  try {
    const localAuthority = req.params.local_authority
    const schemaData = await schemaModel.getData(localAuthority)
    const prefersCsv =
      req.query.format === 'csv' || req.get('Accept') === 'text/csv'

    if (prefersCsv) {
      const fields = schemaModel.getViewFields()
      const parser = new Parser({ fields })
      res.setHeader('Content-Type', 'text/csv')
      res.send(parser.parse(schemaData))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.json(schemaData)
    }
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    let stopData = req.body
    if (req.is('text/csv') || typeof req.body === 'string') {
      try {
        stopData = parseCsv(req.body, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        })
      } catch (e) {
        return res.status(400).json({
          errors: [
            {
              status: '400',
              title: 'Bad Request',
              detail: `Invalid CSV syntax: ${e.message}`
            }
          ]
        })
      }
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
    await schemaModel.createData(stopData)
    res.status(201).json({ rows: stopData.length })
  } catch (err) {
    next(err)
  }
})

export default router
