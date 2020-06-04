const pool = require('../helpers/database');
const view_fields = ['organisation', 'mobile', 'route', 'community', 'stop', 'address', 'postcode', 'geox', 'geoy', 'day', 'arrival', 'departure', 'frequency', 'start', '"end"', 'timetable'];

module.exports.getViewFields = () => view_fields;

module.exports.getData = async (organisation) => {
  let schema_data = [];
  try {
    let query = 'select ' + view_fields.join(', ') + ' from vw_schema';
    if (organisation) query = query + ' where organisation = $1';
    const { rows } = await pool.query(query, (organisation ? [organisation] : []));
    schema_data = rows;
  } catch (e) { }
  return schema_data;
}

module.exports.createData = async (schemadata) => {
  try {
    let params = [];
    let query = 'insert into staging(' + view_fields.join(', ') + ') values ';
    let inserts = [];
    let index = 0;
    schemadata.forEach(stop => {
      let insert_vals = []
      Object.keys(stop).forEach(key => {
        index++;
        insert_vals.push('$' + index)
        params.push(stop[key] != '' ? stop[key] : null);
      });
      inserts.push('(' + insert_vals.join(',') + ')')
    });
    query = query + inserts.join(',');
    await pool.query(query, (params));
  } catch (e) { }
  return;
}