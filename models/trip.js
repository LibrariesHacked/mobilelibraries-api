const pool = require('../helpers/database');
const view_fields = ['id', 'origin_stop_id', 'origin_stop_name', 'destination_stop_id', 'destination_stop_name', 'distance', 'duration', 'route_line'];

module.exports.getTileData = async (x, y, z) => {
  const query = 'select fn_trips_mvt($1, $2, $3)';
  let tile = null;
  try {
    const { rows } = await pool.query(query, [x, y, z]);
    if (rows && rows.length > 0 && rows[0].fn_trips_mvt) tile = rows[0].fn_trips_mvt;
  } catch (e) { }
  return tile;
}

module.exports.getTrips = async () => {
  let trips = null;
  try {
    const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_trips'
    let { rows } = await pool.query(query);
    rows.forEach(row => {
      row.route_line = JSON.parse(row.route_line);
    });
    trips = rows;
  } catch (e) { }
  return trips;
}

module.exports.getTripById = async (id) => {
  let trip = null;
  try {
    const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_trips where id = $1'
    let { rows } = await pool.query(query, [id]);
    if (rows.length > 0) {
      trip = rows[0];
      trip.route_line = JSON.parse(trip.route_line);
    }
  } catch (e) { }
  return trip;
}