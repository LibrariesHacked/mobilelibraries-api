const pool = require('../helpers/database');

// Get Organisations: 
module.exports.getOrganisations = async () => {
    let organisations = [];
    try {
        const { rows } = await pool.query('SELECT id, organisation_name FROM organisation');
        organisations = rows;
    } catch (e) { }
    return organisations;
}

// Get Organisation By ID: 
module.exports.getOrganisationById = async (id) => {
    let organisation = null;
    try {
        const { rows } = await pool.query('SELECT id, organisation_name FROM organisation where id = $1', [id]);
        if (rows.length > 0) organisation = rows[0];
    } catch (e) { }
    return organisation;
}