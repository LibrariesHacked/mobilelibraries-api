const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const mobileModel = require('../models/mobile');

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
    // There may be an organisation ID
    if (req.query.organisation_id) {
        mobileModel.getMobilesByOrganisationId(req.query.organisation_id).then(mobiles => res.json(mobiles));
    } else {
        mobileModel.getMobiles().then(mobiles => res.json(mobiles));
    }
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
    mobileModel.getMobileById(req.params.id)
        .then(mob => {
            if (mob != null) {
                res.json(mob);
            } else {
                res.status(404).json({
                    "errors": [{ status: "404", title: "Not Found" }]
                });
            }
        });
});

/**
 *  @swagger
 *  /api/mobiles:
 *      summary: Create a mobile library
 *      post:
 *          tags:
 *              -   mobiles
 *          description: Create a new mobile library
 *          produces:
 *              -   application/json
 *          parameters:
 *              -   name: mobile
 *                  in: body
 *                  description: The mobile to create.
 *                  schema:
 *                      type: object
 *                  required:
 *                      - name
 *                      - organisation_id
 *                  properties:
 *                      name:
 *                          type: string
 *                      organisation_id:
 *                          type: integer
 *                      timetable:
 *                          type: string
 *          responses: 
 *              201:
 *                  description: Mobile added
 *              422:
 *                  description: Validation error
 */
router.post('/',
    [check('organisation_id').isInt(), check('name').isAlphanumeric()],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
        const mobile = {
            organisation_id: req.body.organisation_id,
            name: req.body.name,
            timetable: req.body.timetable
        };
        mobileModel.createMobile(mobile).then(mobile => res.status(201).json({ mobile }));
    }
);

/**
 *  @swagger
 *  /api/mobiles:
 *      summary: Update a mobile library
 *      put:
 *          tags:
 *              -   mobiles
 *          description: Update a mobile library
 *          produces:
 *              -   application/json
 *          parameters:
 *              -   name: mobile
 *                  in: body
 *                  description: The mobile to update.
 *                  schema:
 *                      type: object
 *                  required:
 *                      - id
 *                  properties:
 *                      id:
 *                          type: integer
 *                      name:
 *                          type: string
 *                      organisation_id:
 *                          type: integer
 *                      timetable:
 *                          type: string
 *          responses: 
 *              200:
 *                  description: Mobile updated
 *              422:
 *                  description: Validation error
 */
router.put('/',
    [check('id').isInt()],
    (req, res) => {
        const id = req.body.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
        const keys = ['name', 'organisation_id', 'timetable'];
        let mobile = req.body;
        // Filter out any unrequired stuff
        Object.keys(mobile).filter(key => !keys.includes(key)).forEach(key => delete mobile[key]);
        mobileModel.updateMobile(id, mobile).then(mobile => res.status(200).json({ mobile }));
    }
);

module.exports = router;