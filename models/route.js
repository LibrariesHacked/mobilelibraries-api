const pool = require('../helpers/database')

const viewFields = [
  'id',
  'organisation_id',
  'mobile_id',
  'name',
  'frequency',
  '"start"',
  '"end"',
  'timetable',
  'number_stops'
]

module.exports.getRoutes = async organisationId => {
  let routes = []
  let query = 'select ' + viewFields.join(', ') + ' from vw_routes'
  if (organisationId) query += ' where organisation_id = $1'
  try {
    const { rows } = await pool.query(
      query,
      organisationId ? [organisationId] : []
    )
    routes = rows
  } catch (e) {}
  return routes
}

module.exports.getRouteById = async id => {
  let route = null
  try {
    const query =
      'select ' + viewFields.join(', ') + ' from vw_routes where id = $1'
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) route = rows[0]
  } catch (e) {}
  return route
}
