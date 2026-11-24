const pool = require('../helpers/database')

const viewFields = [
  'id',
  'country',
  'local_authority_code',
  'name',
  'timetable',
  'website',
  'email',
  'colour',
  'logo',
  'number_mobiles',
  'number_routes',
  'number_stops'
]

module.exports.getViewFields = () => viewFields

module.exports.getLocalAuthorities = async () => {
  let localAuthorities = []
  try {
    const { rows } = await pool.query(
      'select ' + viewFields.join(', ') + ' from vw_local_authorities order by name'
    )
    localAuthorities = rows
  } catch (e) {
    console.error(e)
  }
  return localAuthorities
}

module.exports.getLocalAuthorityById = async id => {
  let localAuthority = null
  try {
    const isCode = typeof id === 'string' && /^[A-Za-z][0-9]{8}$/.test(id.trim())
    const query = isCode
      ? 'select ' + viewFields.join(', ') + ' from vw_local_authorities where local_authority_code = $1'
      : 'select ' + viewFields.join(', ') + ' from vw_local_authorities where id = $1'

    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) localAuthority = rows[0]
  } catch (e) {
    console.error(e)
  }
  return localAuthority
}
