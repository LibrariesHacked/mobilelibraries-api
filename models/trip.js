const pool = require('../helpers/database');
const table_fields = [];

// Get tile data
module.exports.getTileData = async (x, y, z) => {
	const query = 'select fn_trips_mvt($1, $2, $3)';
	let tile = null;
	try {
		const { rows } = await pool.query(query, [x, y, z]);
		if (rows && rows.length > 0 && rows[0].fn_trips_mvt) tile = rows[0].fn_trips_mvt;
	} catch (e) { }
	return tile;
}