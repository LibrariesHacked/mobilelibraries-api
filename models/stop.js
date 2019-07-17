const pool = require('../helpers/database');
const pdfHelper = require('../helpers/pdf');
const moment = require('moment');

const view_fields = ['id', 'route_id', 'route_name', 'mobile_id', 'mobile_name', 'organisation_id', 'organisation_name', 'name', 'community', 'address', 'postcode', 'arrival', 'departure', 'route_start', 'route_end', 'route_day', 'route_frequency', 'route_dates', 'timetable'];
const table_fields = ['route_id', 'name', 'community', 'address', 'postcode', 'arrival', 'departure', 'timetable'];

// Get Stops: 
module.exports.getStops = async (organisation_ids, mobile_ids, route_ids, longitude, latitude, distance, limit, page, sort) => {
	let stops = [];
	let organisations = [];
	if (organisation_ids) organisations = organisation_ids.split('|').map(o => parseInt(o));
	let mobiles = [];
	if (mobile_ids) mobiles = mobile_ids.split('|').map(m => parseInt(m));
	let routes = [];
	if (route_ids) routes = route_ids.split('|').map(r => parseInt(r));
	let params = [
		['limit', limit],
		['page', page]].filter(x => (x[1] !== null));
	try {
		let where_queries = [];
		let limit_query = '';
		let offset_query = '';
		let orderby_query = ' ';

		params.forEach((param, i) => {
			let idx = i + 1;
			if (param[0] === 'limit') limit_query = 'limit $' + idx + ' ';
			if (param[0] === 'page') {
				params[i][1] = (limit * (page - 1)); // Calculate offset from the page and limit
				offset_query = 'offset $' + idx;
			}
		});

		if (view_fields.indexOf(sort) !== -1) orderby_query = 'order by ' + sort + ' asc ';
		params = params.map(p => p[1]); // Change params array just to values.

		if (organisations.length > 0) {
			where_queries.push('organisation_id in (' + organisations.map((o, oidx) => '$' + (oidx + 1 + params.length)).join(',') + ')');
			params = params.concat(organisations);
		}

		if (mobiles.length > 0) {
			where_queries.push('mobile_id in (' + mobiles.map((m, midx) => '$' + (midx + 1 + params.length)).join(',') + ')');
			params = params.concat(mobiles);
		}

		if (routes.length > 0) {
			where_queries.push('route_id in (' + routes.map((r, ridx) => '$' + (ridx + 1 + params.length)).join(',') + ')');
			params = params.concat(routes);
		}

		if (longitude && latitude && distance) {
			where_queries.push('st_dwithin(st_transform(st_setsrid(st_makepoint($' + (params.length + 1) + ', $' + (params.length + 2) + '), 4326), 27700), st_transform(st_setsrid(st_makepoint(longitude, latitude), 4326), 27700), $' + (params.length + 3) + ')');
			params = params.concat([longitude, latitude, distance]);
		}

		const query = 'select ' + view_fields.join(', ') + ', count(*) OVER() AS total from vw_stops '
			+ (where_queries.length > 0 ? 'where ' + where_queries.join(' and ') + ' ' : '')
			+ orderby_query
			+ limit_query
			+ offset_query;

		const { rows } = await pool.query(query, params);

		stops = rows;
	} catch (e) { }
	return stops;
}

// Get Stop By ID: 
module.exports.getStopById = async (id) => {
	let stop = null;
	try {
		const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_stops where id = $1'
		const { rows } = await pool.query(query, [id]);
		if (rows.length > 0) stop = rows[0];
	} catch (e) { }
	return stop;
}

// Get Stop By ID: 
module.exports.getStopPdfById = async (id) => {
	try {
		const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_stops where id = $1'
		const { rows } = await pool.query(query, [id]);
		if (rows.length > 0) {
			stop = rows[0];
			const stream = pdfHelper.createPDFStream();
			return stream;
		} else {
			return null;
		}

	} catch (e) { }
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

// Create stop
module.exports.createStop = async (stop) => {
	try {
		const query = 'insert into mobile (' + table_fields.join(', ') + ') values(' + table_fields.map((f, idx) => '$' + (idx + 1)).join(', ') + ')';
		const params = table_fields.map((f) => stop[f] ? stop[f] : null);
		const { rows } = await pool.query(query, params);
	} catch (e) { }
	return stop;
}

// Update stop
module.exports.updateStop = async (id, stop) => {
	let sets = [];
	let params = [id];
	Object.keys(stop).forEach(key => {
		if (table_fields.indexOf(key) !== -1) {
			params.push(stop[key]);
			sets.push(key + '=' + '$' + (params.length));
		}
	});
	try {
		const query = 'update stop set ' + sets.join(',') + ' where id = $1';
		const { rows } = await pool.query(query, params);
	} catch (e) { }
	return stop;
}