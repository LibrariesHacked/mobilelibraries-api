const express = require('express');
const router = express.Router();

const organisation = require('../models/organisation');

/**
 *  @swagger
 *  /api/organisations:
 *      summary: All mobile library organisations
 *      get:
 *          tags:
 *              -   organisations
 *          description: Return all organisations
 *          responses: 
 *              200:
 *                  description: A list of organisations
 */
router.get('/', function (req, res, next) {
    organisation.getOrganisations().then(orgs => { res.json(orgs) });
});

/**
 *  @swagger
 *  /api/organisations/{id}:
 *      summary: A mobile library organisation
 *      get:
 *          tags:
 *              -   organisations
 *          description: Return an organisation
 *          parameters:
 *              -   name: id
 *                  description: Numeric ID of the organisation
 *                  in: path
 *                  required: true
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: An organisation
 *              404:
 *                  description: Not found
 */
router.get('/:id', function (req, res, next) {
    organisation.getOrganisationById(req.params.id)
        .then(org => {
            if (org != null) {
                res.json(org);
            } else {
                res.status(404).json({
                    "errors": [{ "status": "404", "title": "Not Found" }]
                });
            }
        });
});

module.exports = router;