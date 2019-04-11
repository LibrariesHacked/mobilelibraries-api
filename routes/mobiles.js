const express = require('express');
const router = express.Router();

const mobile = require('../models/mobile');

/**
 *  @swagger
 *  /api/mobiles:
 *      summary: All mobile libraries
 *      get:
 *          tags:
 *              -   mobiles
 *          produces:
 *              -   application/json
 *          parameters:
 *              -   name: organisation_id
 *                  description: Numeric ID of the organisation the mobile is run by
 *                  in: query
 *                  required: false
 *                  type: integer
 *          description: Return all mobiles
 *          responses: 
 *              200:
 *                  description: A list of mobiles
 */
router.get('/', function (req, res, next) {
    mobile.getMobiles().then(mobiles => { res.json(mobiles) });
});

/**
 *  @swagger
 *  /api/mobiles/{id}:
 *      summary: A mobile library
 *      get:
 *          tags:
 *              -   mobiles
 *          description: Return a mobile
 *          produces:
 *              -   application/json
 *          parameters:
 *              -   name: id
 *                  description: Numeric ID of the mobile
 *                  in: path
 *                  required: true
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: A mobile
 *              404:
 *                  description: Not found
 */
router.get('/:id', function (req, res, next) {
    mobile.getMobileById(req.params.id)
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