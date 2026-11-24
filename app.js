const express = require('express')

const bodyParser = require('body-parser')

const app = express()

require('dotenv').config()

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./openapi.json')
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }'
}

const localAuthorities = require('./routes/localAuthorities')
const mobiles = require('./routes/mobiles')
const routes = require('./routes/routes')
const schema = require('./routes/schema')
const stops = require('./routes/stops')
const trips = require('./routes/trips')

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.text({ type: 'text/csv', limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))

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
app.all('/api/*', (req, res) => {
  res.status(404).json({
    errors: [{ status: '404', title: 'Not Found', detail: `Cannot ${req.method} ${req.originalUrl}` }]
  })
})

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions))

const port = process.env.PORT || 8080

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Mobile libraries API running on port ${port}`)
  })
}

module.exports = app
