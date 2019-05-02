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
        const query = 'select * from w_mobiles where organisation_id = $';
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

// Add mobile
module.exports.addMobile = async (mobile) => {
    try {
        const query = 'insert into mobile (name, organisation_id) values($1, $2)';
        const params = [
            mobile.name,
            mobile.organisation_id
        ]
        const { rows } = await pool.query(query, params);
    } catch (e) { }
    return mobile;
}

// Add mobile
module.exports.editMobile = async (mobile) => {
    try {
        const query = 'update mobile set name = $2, organisation_id = $3 where id = $1';
        const params = [
            mobile.id,
            mobile.name,
            mobile.organisation_id
        ]
        const { rows } = await pool.query(query, params);
    } catch (e) { }
    return mobile;
}