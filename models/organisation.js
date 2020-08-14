const pool = require('../helpers/database')
const viewFields = ['id', 'country', 'code', 'name', 'timetable', 'website', 'email', 'colour', 'logo', 'number_mobiles', 'number_routes', 'number_stops']

module.exports.getOrganisations = async () => {
  let organisations = []
  try {
    const { rows } = await pool.query('select ' + viewFields.join(', ') + ' from vw_organisations')
    organisations = rows
  } catch (e) { }
  return organisations
}

module.exports.getOrganisationById = async (id) => {
  let organisation = null
  try {
    const { rows } = await pool.query('select ' + viewFields.join(', ') + ' from vw_organisations where id = $1', [id])
    if (rows.length > 0) organisation = rows[0]
  } catch (e) { }
  return organisation
}
