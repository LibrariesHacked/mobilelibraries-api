const pool = require('../helpers/database')
const viewFields = ['organisation', 'mobile', 'route', 'community', 'stop', 'address', 'postcode', 'geox', 'geoy', 'day', 'arrival', 'departure', 'frequency', 'start', '"end"', 'timetable']

module.exports.getViewFields = () => viewFields

module.exports.getData = async (organisation) => {
  let schemaData = []
  try {
    let query = 'select ' + viewFields.join(', ') + ' from vw_schema'
    if (organisation) query = query + ' where organisation = $1'
    const { rows } = await pool.query(query, (organisation ? [organisation] : []))
    schemaData = rows
  } catch (e) { }
  return schemaData
}

module.exports.createData = async (schemadata) => {
  try {
    const params = []
    let query = 'insert into staging(' + viewFields.join(', ') + ') values '
    const inserts = []
    let index = 0
    schemadata.forEach(stop => {
      const insertVals = []
      Object.keys(stop).forEach(key => {
        index++
        insertVals.push('$' + index)
        params.push(stop[key] !== '' ? stop[key] : null)
      })
      inserts.push('(' + insertVals.join(',') + ')')
    })
    query = query + inserts.join(',')
    await pool.query(query, (params))
  } catch (e) { }
}
