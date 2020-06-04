const pool = require('../helpers/database');
const view_fields = ['id', 'organisation_id', 'mobile_id', 'name', 'frequency', '"start"', '"end"', 'timetable', 'number_stops'];
const table_fields = [];

module.exports.getRoutes = async (organisation_id) => {
  let routes = [];
  let query = 'select ' + view_fields.join(', ') + ' from vw_routes';
  if (organisation_id) query += ' where organisation_id = $1';
  try {
    const { rows } = await pool.query(query, organisation_id ? [organisation_id] : []);
    routes = rows;
  } catch (e) { }
  return routes;
}

module.exports.getRouteById = async (id) => {
  let route = null;
  try {
    const query = 'select ' + view_fields.join(', ') + ' from vw_routes where id = $1';
    const { rows } = await pool.query(query, [id]);
    if (rows.length > 0) route = rows[0];
  } catch (e) { }
  return route;
}

module.exports.createRoute = async (route) => {
  try {
    const query = 'insert into route (' + table_fields.join(', ') + ') values(' + table_fields.map((f, ix) => '$' + (ix + 1)).join(', ') + ')';
    const params = table_fields.map(f => route[f]);
    await pool.query(query, params);
  } catch (e) {
  }
  return mobile;
}

module.exports.updateRoute = async (id, route) => {
  let sets = [];
  let params = [id];
  table_fields.forEach(field => {
    if (route[field]) {
      params.push(route[field]);
      sets.push(field + ' = ' + '$' + (params.length));
    }
  });
  try {
    const query = 'update route set ' + sets.join(',') + ' where id = $1';
    await pool.query(query, params);
  } catch (e) { }
  return route;
}