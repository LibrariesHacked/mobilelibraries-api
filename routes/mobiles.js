const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const mobile = require('../models/mobile');

/**
 *  @swagger
 *  /api/mobiles:
 *      summary: All mobile libraries
 *      get:
 *          tags:
 *              -   mobiles
 *          description: Return all mobiles
 *          produces:
 *              -   application/json
 *          parameters:
 *              -   name: organisation_id
 *                  description: Numeric ID of the organisation the mobile is run by
 *                  in: query
 *                  required: false
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: A list of mobiles
 */
router.get('/', (req, res) => {
    mobile.getMobiles().then(mobiles => { res.json(mobiles) });
});

/**
 *  @swagger
 *  /api/mobiles/{id}:
 *      summary: A mobile library
 *      get:
 *          tags:
 *              -   mobiles
 *          description: Returns a mobile library
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
router.get('/:id', (req, res) => {
    mobile.getMobileById(req.params.id)
        .then(org => {
            if (org != null) {
                res.json(org);
            } else {
                res.status(404).json({
                    "errors": [{ status: "404", title: "Not Found" }]
                });
            }
        });
});

router.post('/', [
    check('organisation_id').isInt(),
    check('mobile_name').isAlphanumeric()],
    (req, res) => {
        // If validation errors then return
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
        }

        const mobile = {
            organisation_id: req.body.organisation_id,
            mobile_name: req.body.mobile_name
        };

        // Create the mobile
        res.json(201).json({});
    }
);

module.exports = router;