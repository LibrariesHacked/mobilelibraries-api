const pool = require('../helpers/database')

const viewFields = [
  'id',
  'local_authority_id',
  'local_authority_code',
  'mobile_id',
  'name',
  'frequency',
  '"start"',
  '"end"',
  'timetable',
  'number_stops'
]

module.exports.getViewFields = () => viewFields

module.exports.getRoutes = async (localAuthorityId, mobileId) => {
  let routes = []
  let query = 'select ' + viewFields.join(', ') + ' from vw_routes'
  const whereQueries = []
  const params = []

  if (localAuthorityId) {
    params.push(localAuthorityId)
    whereQueries.push(`local_authority_id = $${params.length}`)
  }

  if (mobileId) {
    params.push(mobileId)
    whereQueries.push(`mobile_id = $${params.length}`)
  }

  if (whereQueries.length > 0) {
    query += ' where ' + whereQueries.join(' and ')
  }
  query += ' order by name'

  try {
    const { rows } = await pool.query(query, params)
    routes = rows
  } catch (e) {
    console.error(e)
  }
  return routes
}

module.exports.getRouteById = async id => {
  let route = null
  try {
    const query =
      'select ' + viewFields.join(', ') + ' from vw_routes where id = $1'
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) route = rows[0]
  } catch (e) {
    console.error(e)
  }
  return route
}
