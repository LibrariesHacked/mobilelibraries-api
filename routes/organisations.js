const express = require('express');
const router = express.Router();

const organisation = require('../models/organisation');

/**
 *  @swagger
 *  /api/organisations:
 *      get:
 *          description: Return all organisations
 *          responses: 
 *              200:
 *                  description: A list of organisations
 */
router.get('/', function (req, res, next) {
    organisation.getAllOrganisations().then(orgs => { res.json(orgs) });
});

module.exports = router;