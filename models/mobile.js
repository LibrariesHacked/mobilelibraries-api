const pool = require('../helpers/database');

// Get mobiles: 
module.exports.getMobiles = async () => {
    let mobiles = [];
    let query = 'select id, name from mobile';
    try {
        const { rows } = await pool.query(query);
        mobiles = rows;
    } catch (e) { 
        console.log(e);
    }
    return mobiles;
}

// Get mobiles: 
module.exports.getMobilesByOrganisationId = async (organisation_id) => {
    let mobiles = [];
    let query = 'select id, name from mobile where organisation_id = $';
    try {
        const { rows } = await pool.query(query, [organisation_id]);
        mobiles = rows;
    } catch (e) { }
    return mobiles;
}

// Get mobile By ID: 
module.exports.getMobileById = async (id) => {
    let mobile = null;
    try {
        const { rows } = await pool.query('SELECT id, name FROM mobile where id = $1', [id]);
        if (rows.length > 0) mobile = rows[0];
    } catch (e) { }
    return mobile;
}

// Add mobile
module.exports.addMobile = async (mobile) => {
    try {
        const { rows } = await pool.query('insert organisation_id, name into mobile', [mobile.organisation_id, mobile.mobile_name]);
    } catch (e) { }
    return mobile;
}