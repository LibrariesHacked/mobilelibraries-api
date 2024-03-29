const pool = require('../helpers/database')

const viewFields = [
  'id',
  'organisation_id',
  'name',
  'timetable',
  'number_routes',
  'number_stops'
]

const viewLocationFields = [
  'mobile_id',
  'current_stop_id',
  'current_stop_departure',
  'current_stop_name',
  'previous_stop_id',
  'previous_stop_departure',
  'previous_stop_name',
  'next_stop_id',
  'next_stop_arrival',
  'next_stop_name',
  'updated',
  'update_type',
  'geox',
  'geoy',
  'route_section'
]

module.exports.getMobiles = async () => {
  let mobiles = []
  const query = 'select ' + viewFields.join(', ') + ' from vw_mobiles'
  try {
    const { rows } = await pool.query(query)
    mobiles = rows
  } catch (e) {}
  return mobiles
}

module.exports.getMobilesByOrganisationId = async organisationId => {
  let mobiles = []
  try {
    const query =
      'select ' +
      viewFields.join(', ') +
      ' from vw_mobiles where organisation_id = $1'
    const { rows } = await pool.query(query, [organisationId])
    mobiles = rows
  } catch (e) {}
  return mobiles
}

module.exports.getMobileById = async id => {
  let mobile = null
  try {
    const query =
      'select ' + viewFields.join(', ') + ' from vw_mobiles where id = $1'
    const params = [id]
    const { rows } = await pool.query(query, params)
    if (rows.length > 0) mobile = rows[0]
  } catch (e) {}
  return mobile
}

module.exports.getMobileLocations = async () => {
  let locations = []
  const getQuery =
    'select ' + viewLocationFields.join(', ') + ' from vw_mobiles_location'
  try {
    await pool.query('select fn_updates()')
    const { rows } = await pool.query(getQuery)
    locations = rows
    locations.forEach(location => {
      if (location.route_section) {
        location.route_section = JSON.parse(location.route_section)
      }
    })
  } catch (e) {}
  return locations
}

module.exports.getMobilesWithinDistance = async (
  longitude,
  latitude,
  distance
) => {
  let mobiles = []
  const query = 'select * from fn_mobiles_nearest($1, $2, $3)'
  try {
    const { rows } = await pool.query(query, [longitude, latitude, distance])
    mobiles = rows
  } catch (e) {}
  return mobiles
}
