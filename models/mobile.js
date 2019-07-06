const pool = require('../helpers/database');
const view_fields = ['id', 'organisation_id', 'name', 'timetable', 'number_routes', 'number_stops'];
const view_location_fields = ['mobile_id', 'current_stop_id', 'current_stop_departure', 'current_stop_name', 'previous_stop_id', 'previous_stop_departure', 'previous_stop_name', 'next_stop_id', 'next_stop_arrival', 'next_stop_name', 'updated', 'update_type', 'geox', 'geoy', 'route_section'];

// Get mobiles: 
module.exports.getMobiles = async () => {
    let mobiles = [];
    const query = 'select ' + view_fields.join(', ') + ' from vw_mobiles';
    try {
        const { rows } = await pool.query(query);
        mobiles = rows;
    } catch (e) { }
    return mobiles;
}

// Get mobiles: 
module.exports.getMobilesByOrganisationId = async (organisation_id) => {
    let mobiles = [];
    try {
        const query = 'select ' + view_fields.join(', ') + ' from vw_mobiles where organisation_id = $1';
        const { rows } = await pool.query(query, [organisation_id]);
        mobiles = rows;
    } catch (e) { }
    return mobiles;
}

// Get mobile By ID: 
module.exports.getMobileById = async (id) => {
    let mobile = null;
    try {
        const query = 'select ' + view_fields.join(', ') + ' from vw_mobiles where id = $1';
        const params = [id];
        const { rows } = await pool.query(query, params);
        if (rows.length > 0) mobile = rows[0];
    } catch (e) { }
    return mobile;
}

// Get mobile locations: 
module.exports.getMobileLocations = async () => {
    let locations = [];
    const update_query = 'select fn_update_estimate_locations()';
    const get_query = 'select ' + view_location_fields.join(', ') + ' from vw_mobiles_location';
    try {
        await pool.query(update_query);
        const { rows } = await pool.query(get_query);
        locations = rows;
        locations.forEach(location => {
            if (location.route_section) location.route_section = JSON.parse(location.route_section);
        });
    } catch (e) { }
    return locations;
}

// Create mobile
module.exports.createMobile = async (mobile) => {
    try {
        const query = 'insert into mobile (organisation_id, name, timetable) values($1, $2, $3)';
        const params = [
            mobile.organisation_id,
            mobile.name,
            mobile.timetable
        ]
        const { rows } = await pool.query(query, params);
    } catch (e) {
    }
    return mobile;
}

// Update mobile
module.exports.updateMobile = async (id, mobile) => {
    let sets = [];
    let params = [id];
    Object.keys(mobile).forEach(key => {
        if (['organisation_id', 'name', 'timetable'].indexOf(key) !== -1) {
            params.push(mobile[key]);
            sets.push(key + '=' + '$' + (params.length));
        }
    });
    try {
        const query = 'update mobile set ' + sets.join(',') + ' where id = $1';
        const { rows } = await pool.query(query, params);
    } catch (e) { }
    return mobile;
}