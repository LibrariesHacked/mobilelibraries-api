const pool = require('../helpers/database');


// Get Stops: 
module.exports.getStops = async () => {
    let stops = [];
    try {
        const query = 'select id, route_id, mobile_id, organisation_id, name, community, address, postcode, arrival, departure, timetable from vw_stops';
        const { rows } = await pool.query(query);
        stops = rows;
    } catch (e) { }
    return stops;
}

// Get tile data
module.exports.getTileData = async (x, y, z) => {
    const query = 'select fn_stops_mvt($1, $2, $3)';
    let tile = null;
    try {
        const { rows } = await pool.query(query, [x, y, z]);
        if (rows && rows.length > 0 && rows[0].fn_stops_mvt) tile = rows[0].fn_stops_mvt;
    } catch (e) { }
    return tile;
}