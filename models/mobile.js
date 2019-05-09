const pool = require('../helpers/database');

// Get mobiles: 
module.exports.getMobiles = async () => {
    let mobiles = [];
    const query = 'select * from vw_mobiles';
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
        const query = 'select * from vw_mobiles where organisation_id = $1';
        const params = [organisation_id];
        const { rows } = await pool.query(query, params);
        mobiles = rows;
    } catch (e) { }
    return mobiles;
}

// Get mobile By ID: 
module.exports.getMobileById = async (id) => {
    let mobile = null;
    try {
        const query = 'select * from vw_mobiles where id = $1';
        const params = [id];
        const { rows } = await pool.query(query, params);
        if (rows.length > 0) mobile = rows[0];
    } catch (e) { }
    return mobile;
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