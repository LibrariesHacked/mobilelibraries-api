const pool = require('../helpers/database')
const viewFields = ['id', 'organisation_id', 'mobile_id', 'name', 'frequency', '"start"', '"end"', 'timetable', 'number_stops']
const tableFields = []

module.exports.getRoutes = async (organisationId) => {
  let routes = []
  let query = 'select ' + viewFields.join(', ') + ' from vw_routes'
  if (organisationId) query += ' where organisation_id = $1'
  try {
    const { rows } = await pool.query(query, organisationId ? [organisationId] : [])
    routes = rows
  } catch (e) { }
  return routes
}

module.exports.getRouteById = async (id) => {
  let route = null
  try {
    const query = 'select ' + viewFields.join(', ') + ' from vw_routes where id = $1'
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) route = rows[0]
  } catch (e) { }
  return route
}

module.exports.createRoute = async (route) => {
  try {
    const query = 'insert into route (' + tableFields.join(', ') + ') values(' + tableFields.map((f, ix) => '$' + (ix + 1)).join(', ') + ')'
    const params = tableFields.map(f => route[f])
    await pool.query(query, params)
  } catch (e) { }
  return true
}

module.exports.updateRoute = async (id, route) => {
  const sets = []
  const params = [id]
  tableFields.forEach(field => {
    if (route[field]) {
      params.push(route[field])
      sets.push(field + ' = ' + '$' + (params.length))
    }
  })
  try {
    const query = 'update route set ' + sets.join(',') + ' where id = $1'
    await pool.query(query, params)
  } catch (e) { }
  return route
}
