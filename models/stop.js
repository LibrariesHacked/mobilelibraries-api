const pool = require('../helpers/database');


// Get Stops: 
module.exports.getStops = async (organisation_id, mobile_id, route_id, limit, page, sort) => {
    let stops = [];
    let params = [
        ['organisation_id', organisation_id],
        ['mobile_id', mobile_id],
        ['route_id', route_id],
        ['limit', limit],
        ['page', page]].filter(x => (x[1] !== null));
    try {
        let where_queries = [];
        let limit_query = '';
        let offset_query = '';
        let orderby_query = ' ';

        params.forEach((param, i) => {
            let idx = i + 1;
            if (['organisation_id', 'route_id', 'mobile_id']
                .indexOf(param[0]) !== -1) where_queries.push(param[0] + ' = $' + idx);
            if (param[0] === 'limit') limit_query = 'limit $' + idx + ' ';
            if (param[0] === 'page') {
                params[i][1] = (limit * (page - 1)); // Calculate offset from the page and limit
                offset_query = 'offset $' + idx;
            }
        });

        const fields = ['id', 'route_id', 'mobile_id', 'organisation_id', 'name', 'community', 'address', 'postcode', 'arrival', 'departure', 'timetable'];
        
        if (fields.indexOf(sort) !== -1) orderby_query = 'order by ' + sort + ' asc ';

        params = params.map(p => p[1]); // Change params array just to values.

        const query = 'select ' + fields.join(', ') + ', count(*) OVER() AS total from vw_stops '
        + (where_queries.length > 0 ? 'where ' + where_queries.join(' and ') + ' ' : '')
        + orderby_query
        + limit_query
        + offset_query;

        const { rows } = await pool.query(query, params);

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