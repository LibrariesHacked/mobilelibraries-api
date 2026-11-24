const pool = require('../helpers/database')

const viewFields = [
  'local_authority',
  'local_authority_code',
  'mobile_name',
  'route',
  'community',
  'stop',
  'address',
  'postcode',
  'geox',
  'geoy',
  'day',
  'type',
  'arrival',
  'departure',
  'frequency',
  'start',
  '"end"',
  'exceptions',
  'timetable'
]

// The unquoted field names for output mapping / queries
const exportFields = [
  'local_authority',
  'local_authority_code',
  'mobile_name',
  'route',
  'community',
  'stop',
  'address',
  'postcode',
  'geox',
  'geoy',
  'day',
  'type',
  'arrival',
  'departure',
  'frequency',
  'start',
  'end',
  'exceptions',
  'timetable'
]

module.exports.getViewFields = () => exportFields

module.exports.getData = async localAuthority => {
  let schemaData = []
  try {
    let query = 'select ' + viewFields.join(', ') + ' from vw_schema'
    const params = []
    if (localAuthority) {
      query += ' where local_authority = $1 or local_authority_code = $1'
      params.push(localAuthority)
    }
    query += ' order by local_authority, mobile_name, route, day, arrival'
    const { rows } = await pool.query(query, params)
    schemaData = rows
  } catch (e) {
    console.error(e)
  }
  return schemaData
}

module.exports.createData = async schemadata => {
  if (!schemadata || !Array.isArray(schemadata) || schemadata.length === 0) {
    return
  }

  const stagingCols = [
    'local_authority',
    'local_authority_code',
    'mobile_name',
    'route',
    'community',
    'stop',
    'address',
    'postcode',
    'geox',
    'geoy',
    'day',
    'type',
    'arrival',
    'departure',
    'frequency',
    '"start"',
    '"end"',
    'exceptions',
    'timetable'
  ]

  const distinctAuthorities = new Set()

  try {
    // Process in batches of up to 500 rows
    const batchSize = 500
    for (let b = 0; b < schemadata.length; b += batchSize) {
      const chunk = schemadata.slice(b, b + batchSize)
      const params = []
      const inserts = []
      let index = 0

      chunk.forEach(row => {
        // Normalize keys (support standard lowercase or official CSV header title casing)
        const getVal = (...keys) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return row[k]
            }
          }
          return null
        }

        const la = getVal('local_authority', 'Local authority')
        const laCode = getVal('local_authority_code', 'Local authority code')
        const mobile = getVal('mobile_name', 'Mobile name')
        const route = getVal('route', 'Route')
        const community = getVal('community', 'Community')
        const stop = getVal('stop', 'Stop', 'name', 'Name')
        const address = getVal('address', 'Address')
        const postcode = getVal('postcode', 'Postcode')
        const geox = getVal('geox', 'GeoX', 'longitude', 'Longitude')
        const geoy = getVal('geoy', 'GeoY', 'latitude', 'Latitude')
        const day = getVal('day', 'Day')
        const type = getVal('type', 'Type') || 'Public'
        const arrival = getVal('arrival', 'Arrival')
        const departure = getVal('departure', 'Departure')
        const frequency = getVal('frequency', 'Frequency')
        const start = getVal('start', 'Start')
        const end = getVal('end', 'End')
        const exceptions = getVal('exceptions', 'Exceptions')
        const timetable = getVal('timetable', 'Timetable')

        if (la) distinctAuthorities.add(la)
        if (laCode) distinctAuthorities.add(laCode)

        const rowValues = [
          la,
          laCode,
          mobile,
          route,
          community,
          stop,
          address,
          postcode,
          geox ? Number(geox) : null,
          geoy ? Number(geoy) : null,
          day,
          type,
          arrival,
          departure,
          frequency,
          start,
          end,
          exceptions,
          timetable
        ]

        const placeholders = []
        rowValues.forEach(val => {
          index++
          placeholders.push('$' + index)
          params.push(val)
        })
        inserts.push('(' + placeholders.join(', ') + ')')
      })

      const query = `insert into stop_staging (${stagingCols.join(', ')}) values ${inserts.join(', ')}`
      await pool.query(query, params)
    }

    // Load staging data into main tables for each authority
    for (const auth of distinctAuthorities) {
      await pool.query('select fn_load_stops_staging($1)', [auth])
    }

    // Update schedules and location estimates
    await pool.query('select fn_updates()')
  } catch (e) {
    console.error('Error in createData:', e)
    throw e
  }
}
