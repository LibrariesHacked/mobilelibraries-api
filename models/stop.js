const pool = require('../helpers/database');
const iCalHelper = require('../helpers/ical');
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

// Get Stop PDF By ID: 
module.exports.getStopPdfById = async (id) => {

	try {
		const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_stops where id = $1'
		const { rows } = await pool.query(query, [id]);
		if (rows.length > 0) {
			stop = rows[0];

			const dates = stop.route_dates.map(d => {
				return moment(d).format('Do MMM YYYY');
			}).join(', ');

			const definition = {
				content: [
					{ text: 'Stop timetable', style: 'header' },
					{
						layout: 'lightHorizontalLines',
						table: {
							headerRows: 1,
							widths: ['auto', 'auto'],
							body: [
								['Stop', stop.name],
								['Day', stop.route_day],
								['Time', stop.arrival + '-' + stop.departure]
							]
						}
					},
					{ text: 'Dates: ' + dates, style: 'normal' }
				]
			};

			const stream = pdfHelper.createPDFStream(definition);
			return stream;
		} else {
			return null;
		}

	} catch (e) { }
}


module.exports.getStopCalendarById = async (id) => {
	try {
		const query = 'select ' + view_fields.join(', ') + ' ' + 'from vw_stops where id = $1'
		const { rows } = await pool.query(query, [id]);
		if (rows.length > 0) {
			stop = rows[0];
			const cal = {
				summary: stop.mobile_name + ' mobile library visit',
				description: stop.organisation_name + ' ' + stop.mobile_name + ' visiting ' + stop.name,
				location: stop.address,
				start: moment(stop.route_dates[0] + '' + stop.arrival).format(),
				end: moment(stop.route_dates[0] + '' + stop.departure).format(),
				rrule: stop.route_frequency + ';UNTIL=' + moment(stop.route_dates[stop.route_dates.length - 1]).format(),
				url: stop.timetable
			}
			return iCalHelper.createCalendar(cal);
		} else {
			return null;
		}
	} catch (e) { 
		console.log(e);
	}
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