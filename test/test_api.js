process.env.NODE_ENV = 'test'
const app = require('../app')
const pool = require('../helpers/database')
const assert = require('assert')

async function runTests() {
  console.log('Starting Mobile Libraries API test suite...')

  const server = app.listen(0)
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  let passed = 0
  let failed = 0

  async function check(name, fn) {
    try {
      await fn()
      console.log(`  ✓ ${name}`)
      passed++
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message)
      failed++
    }
  }

  try {
    // 1. OpenAPI JSON
    await check('GET /openapi.json returns valid 3.0.3 specification', async () => {
      const res = await fetch(`${baseUrl}/openapi.json`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.openapi, '3.0.3')
      assert.strictEqual(data.info.title, 'Mobile Libraries API')
      assert.ok(data.paths['/api/localauthorities'])
      assert.ok(data.components.schemas.LocalAuthority)
    })

    // 2. Swagger UI
    await check('GET / returns Swagger UI HTML', async () => {
      const res = await fetch(`${baseUrl}/`)
      assert.strictEqual(res.status, 200)
      const html = await res.text()
      assert.ok(html.includes('swagger-ui'))
    })

    // 3. Local Authorities List
    let sampleLa = null
    await check('GET /api/localauthorities returns list of authorities', async () => {
      const res = await fetch(`${baseUrl}/api/localauthorities`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      sampleLa = data.find(l => l.name === 'Angus') || data[0]
      assert.ok(sampleLa.local_authority_code)
      assert.ok(sampleLa.name)
    })

    // 4. Local Authority By ID and Code
    await check('GET /api/localauthorities/:id by numeric ID and GSS code', async () => {
      const resId = await fetch(`${baseUrl}/api/localauthorities/${sampleLa.id}`)
      assert.strictEqual(resId.status, 200)
      const dataId = await resId.json()
      assert.strictEqual(dataId.name, sampleLa.name)

      const resCode = await fetch(`${baseUrl}/api/localauthorities/${sampleLa.local_authority_code}`)
      assert.strictEqual(resCode.status, 200)
      const dataCode = await resCode.json()
      assert.strictEqual(dataCode.name, sampleLa.name)
    })

    // 5. Mobiles List & Filter
    let sampleMobile = null
    await check('GET /api/mobiles returns list and filters by local_authority_id', async () => {
      const res = await fetch(`${baseUrl}/api/mobiles`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      sampleMobile = data[0]
      assert.ok(sampleMobile.local_authority_id)

      const resFiltered = await fetch(`${baseUrl}/api/mobiles?local_authority_id=${sampleLa.id}`)
      assert.strictEqual(resFiltered.status, 200)
      const dataFiltered = await resFiltered.json()
      assert.ok(Array.isArray(dataFiltered))
      dataFiltered.forEach(m => assert.strictEqual(m.local_authority_id, sampleLa.id))
    })

    // 6. Mobile by ID
    await check('GET /api/mobiles/:id returns mobile vehicle', async () => {
      const res = await fetch(`${baseUrl}/api/mobiles/${sampleMobile.id}`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.id, sampleMobile.id)
      assert.strictEqual(data.name, sampleMobile.name)
    })

    // 7. Mobile Locations
    await check('GET /api/mobiles/locations returns location array', async () => {
      const res = await fetch(`${baseUrl}/api/mobiles/locations`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    })

    // 8. Mobile Nearest
    await check('GET /api/mobiles/nearest returns nearest vehicles', async () => {
      const res = await fetch(`${baseUrl}/api/mobiles/nearest?longitude=-2.99774&latitude=56.50186&distance=20000`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    })

    // 9. Routes List & Filter
    let sampleRoute = null
    await check('GET /api/routes returns routes and filters', async () => {
      const res = await fetch(`${baseUrl}/api/routes`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      sampleRoute = data[0]

      const resFiltered = await fetch(`${baseUrl}/api/routes?local_authority_id=${sampleLa.id}`)
      assert.strictEqual(resFiltered.status, 200)
      const dataFiltered = await resFiltered.json()
      assert.ok(Array.isArray(dataFiltered))
      dataFiltered.forEach(r => assert.strictEqual(r.local_authority_id, sampleLa.id))
    })

    // 10. Route by ID
    await check('GET /api/routes/:id returns single route', async () => {
      const res = await fetch(`${baseUrl}/api/routes/${sampleRoute.id}`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.id, sampleRoute.id)
    })

    // 11. Stops List & Pagination Headers
    let sampleStop = null
    await check('GET /api/stops returns stops and X-Total-Count header', async () => {
      const res = await fetch(`${baseUrl}/api/stops?local_authority_ids=${sampleLa.id}&limit=5`)
      assert.strictEqual(res.status, 200)
      assert.ok(res.headers.get('x-total-count'))
      assert.strictEqual(res.headers.get('x-page'), '1')
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.strictEqual(data.length, 5)
      sampleStop = data[0]
      assert.ok(sampleStop.local_authority_name)
      assert.ok(sampleStop.route_schedule)
    })

    // 12. Stops Filter by GSS code
    await check('GET /api/stops?local_authority_codes= filters by GSS code', async () => {
      const res = await fetch(`${baseUrl}/api/stops?local_authority_codes=${sampleLa.local_authority_code}&limit=3`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      data.forEach(s => assert.strictEqual(s.local_authority_code, sampleLa.local_authority_code))
    })

    // 13. Stops GeoJSON Output
    await check('GET /api/stops with Accept: application/geo+json returns FeatureCollection', async () => {
      const res = await fetch(`${baseUrl}/api/stops?limit=5`, {
        headers: { Accept: 'application/geo+json' }
      })
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.type, 'FeatureCollection')
      assert.ok(Array.isArray(data.features))
      assert.strictEqual(data.features[0].geometry.type, 'Point')
    })

    // 14. Stop by ID
    await check('GET /api/stops/:id returns stop details', async () => {
      const res = await fetch(`${baseUrl}/api/stops/${sampleStop.id}`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.strictEqual(data.id, sampleStop.id)
      assert.strictEqual(data.name, sampleStop.name)
    })

    // 15. Stop PDF flyer
    await check('GET /api/stops/:id/pdf returns PDF flyer', async () => {
      const res = await fetch(`${baseUrl}/api/stops/${sampleStop.id}/pdf`)
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.headers.get('content-type'), 'application/pdf')
      const buf = await res.arrayBuffer()
      assert.ok(buf.byteLength > 100)
    })

    // 16. Stop iCalendar
    await check('GET /api/stops/:id/ics returns valid iCalendar', async () => {
      const res = await fetch(`${baseUrl}/api/stops/${sampleStop.id}/ics`)
      assert.strictEqual(res.status, 200)
      assert.ok(res.headers.get('content-type').includes('text/calendar'))
      const text = await res.text()
      assert.ok(text.includes('BEGIN:VCALENDAR'))
      assert.ok(text.includes('BEGIN:VEVENT'))
    })

    // 17. Nearest Stops
    await check('GET /api/stops/nearest returns closest stops', async () => {
      const res = await fetch(`${baseUrl}/api/stops/nearest?longitude=-2.99774&latitude=56.50186&limit=2`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.strictEqual(data.length, 2)
      assert.ok(data[0].distance !== undefined)
    })

    // 18. Stop Vector Tiles
    await check('GET /api/stops/:z/:x/:y.mvt returns vector tile or 204', async () => {
      const res = await fetch(`${baseUrl}/api/stops/10/509/328.mvt`)
      assert.ok(res.status === 200 || res.status === 204)
    })

    // 19. Trips List
    await check('GET /api/trips returns trips list', async () => {
      const res = await fetch(`${baseUrl}/api/trips`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
    })

    // 20. Schema Data (JSON)
    await check('GET /api/schema returns stops conforming to v2.0.0 schema', async () => {
      const res = await fetch(`${baseUrl}/api/schema/${encodeURIComponent(sampleLa.name)}`)
      assert.strictEqual(res.status, 200)
      const data = await res.json()
      assert.ok(Array.isArray(data))
      assert.ok(data.length > 0)
      const item = data[0]
      assert.ok(item.local_authority)
      assert.ok(item.local_authority_code)
      assert.ok(item.mobile_name)
      assert.ok(item.route)
      assert.ok(item.stop)
      assert.ok(item.geox !== undefined)
      assert.ok(item.geoy !== undefined)
      assert.ok(item.type)
      assert.ok(item.arrival)
      assert.ok(item.departure)
    })

    // 21. Schema Data (CSV)
    await check('GET /api/schema/:authority with text/csv returns CSV text', async () => {
      const res = await fetch(`${baseUrl}/api/schema/${encodeURIComponent(sampleLa.name)}`, {
        headers: { Accept: 'text/csv' }
      })
      assert.strictEqual(res.status, 200)
      assert.ok(res.headers.get('content-type').includes('text/csv'))
      const text = await res.text()
      assert.ok(text.startsWith('"local_authority"') || text.startsWith('local_authority'))
      assert.ok(text.includes(sampleLa.name))
    })

    // 22. 404 for removed legacy routes and non-existent resources
    await check('GET /api/organisations returns 404 (removed for breaking change)', async () => {
      const res = await fetch(`${baseUrl}/api/organisations`)
      assert.strictEqual(res.status, 404)
    })

    await check('GET /api/local-authorities returns 404 (only /api/localauthorities mounted)', async () => {
      const res = await fetch(`${baseUrl}/api/local-authorities`)
      assert.strictEqual(res.status, 404)
    })

    await check('GET non-existent stop returns 404 JSON', async () => {
      const res = await fetch(`${baseUrl}/api/stops/999999999`)
      assert.strictEqual(res.status, 404)
      const data = await res.json()
      assert.ok(data.errors)
      assert.strictEqual(data.errors[0].status, '404')
    })
  } finally {
    server.close()
    await pool.end()
  }

  console.log('\n======================================')
  console.log(`Test Results: ${passed} passed, ${failed} failed`)
  console.log('======================================')

  if (failed > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
