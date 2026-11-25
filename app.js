/**
 * @file Main Express application entry point for the Mobile Libraries API.
 * @module app
 */

import express from 'express'
import { readFile } from 'node:fs/promises'
import swaggerUi from 'swagger-ui-express'

import localAuthorities from './routes/localAuthorities.js'
import mobiles from './routes/mobiles.js'
import routes from './routes/routes.js'
import schema from './routes/schema.js'
import stops from './routes/stops.js'
import trips from './routes/trips.js'

// Load .env file if available (Node 20.12+ / 21.7+ built-in)
try {
  process.loadEnvFile?.('.env')
} catch {}

const swaggerDocument = JSON.parse(
  await readFile(new URL('./openapi.json', import.meta.url), 'utf8')
)

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }'
}

const app = express()

// CORS headers and preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Body parsers (using Express built-in parsers)
app.use(express.json({ limit: '50mb' }))
app.use(express.text({ type: 'text/csv', limit: '50mb' }))
app.use(express.urlencoded({ extended: false, limit: '50mb' }))

// Raw OpenAPI JSON spec endpoint
app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument)
})

// API routes
app.use('/api/localauthorities', localAuthorities)
app.use('/api/mobiles', mobiles)
app.use('/api/routes', routes)
app.use('/api/schema', schema)
app.use('/api/stops', stops)
app.use('/api/trips', trips)

// 404 handler for unhandled /api/* routes
app.use('/api', (req, res) => {
  res.status(404).json({
    errors: [
      {
        status: '404',
        title: 'Not Found',
        detail: `Cannot ${req.method} ${req.originalUrl}`
      }
    ]
  })
})

// Swagger documentation UI at root
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions))

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err)
  if (res.headersSent) {
    return next(err)
  }
  const status = err.status || 500
  res.status(status).json({
    errors: [
      {
        status: String(status),
        title: err.title || err.name || 'Internal Server Error',
        detail: err.message || 'An unexpected error occurred'
      }
    ]
  })
})

const port = process.env.PORT || 8080

if (process.env.NODE_ENV !== 'test') {
  if (typeof port === 'string' && port.startsWith('\\\\.\\pipe\\')) {
    app.listen(port, () => {
      console.log(`Mobile libraries API running on pipe ${port}`)
    })
  } else {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Mobile libraries API running on port ${port}`)
    })
  }
}

export default app
