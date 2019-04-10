const pool = require('../helpers/database');

// Get All Locations: 
module.exports.getAllOrganisations = async () => {
    try {
        const { rows } = await pool.query('SELECT * FROM organisation');
        console.log('user:', rows)
    } catch (e) {
        console.log(e);
    }
}