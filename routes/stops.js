const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const stopModel = require('../models/stop');

/**
 *  @swagger
 *  /api/stops:
 *      summary: All mobile library stops
 *      get:
 *          tags:
 *              -   stops
 *          description: Return all stops
 *          parameters:
 *              -   name: organisation_id
 *                  description: Numeric ID of the organisation
 *                  in: query
 *                  required: false
 *                  type: integer
 *              -   name: mobile_id
 *                  description: Numeric ID of the mobile
 *                  in: query
 *                  required: false
 *                  type: integer
 *              -   name: route_id
 *                  description: Numeric ID of the route
 *                  in: query
 *                  required: false
 *                  type: integer
 *              -   name: limit
 *                  description: Number of results to return
 *                  in: query
 *                  required: false
 *                  type: integer
 *              -   name: page
 *                  description: The page to return (for paged results)
 *                  in: query
 *                  required: false
 *                  type: integer
 *              -   name: sort
 *                  description: The column to sort by
 *                  in: query
 *                  required: false
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: A list of stops
 */
router.get('/', function (req, res, next) {

	// Parameters
	const organisation_id = req.query.organisation_id || null;
	const mobile_id = req.query.mobile_id || null;
	const route_id = req.query.route_id || null;
	const limit = req.query.limit || 1000;
	const page = req.query.page || 1;
	const sort = req.query.sort || 'id';

	stopModel.getStops(organisation_id, mobile_id, route_id, limit, page, sort).then(stops => {
		// We are going to set content headers to set the paging values
		res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page');
		res.setHeader('X-Total-Count', stops.length > 0 ? stops[0].total : 0);
		res.setHeader('X-Page', page);
		stops = stops.map(({ total, ...stop }) => stop); // Remove total column
		res.json(stops);
	});
});

/**
 *  @swagger
 *  /api/stops/{id}:
 *      summary: A mobile library stop
 *      get:
 *          tags:
 *              -   stops
 *          description: Returns a mobile library stop
 *          parameters:
 *              -   name: id
 *                  description: Numeric ID of the stop
 *                  in: path
 *                  required: true
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: A mobile library stop
 *              404:
 *                  description: Not found
 */
router.get('/:id', function (req, res, next) {

	stopModel.getStopById(req.params.id)
		.then(stop => {
			if (stop != null) return res.json(stop);
			res.status(404).json({
				"errors": [{ "status": "404", "title": "Not Found" }]
			});
		});
});

/**
 *  @swagger
 *  /api/stops/{z}/{x}/{y}.mvt:
 *      summary: Vector tile service for mobile library stops
 *      get:
 *          tags:
 *              -   stops
 *          description: Return stops within an x, y and zoom level
 *          parameters:
 *              -   name: x
 *                  description: X coordinate
 *                  in: path
 *                  required: true
 *                  type: integer
 *              -   name: y
 *                  description: Y coordinate
 *                  in: path
 *                  required: true
 *                  type: integer
 *              -   name: z
 *                  description: Zoom level
 *                  in: path
 *                  required: true
 *                  type: integer
 *          responses: 
 *              200:
 *                  description: Mobile stops vector tile
 *              204:
 *                  description: No vector content
 */
router.get('/:z/:x/:y.mvt', async (req, res) => {
	const { z, x, y } = req.params;
	stopModel.getTileData(x, y, z).then(tile => {
		res.setHeader('Content-Type', 'application/x-protobuf');
		if (!tile) return res.status(204).send(null);
		res.send(tile);
	});
});

/**
 *  @swagger
 *  /api/stops:
 *      summary: Create a mobile library stop
 *      post:
 *          tags:
 *              -   stops
 *          description: Create a new mobile library stop
 *          responses: 
 *              201:
 *                  description: Mobile library stop added
 *              422:
 *                  description: Validation error
 */
router.post('/',
	[check('organisation_id').isInt(), check('name').isAlphanumeric()],
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
		const mobile = {
			name: req.body.name,
			route_id: req.body.route_id,
			community: req.body.community,
			address: req.body.address,
			postcode: req.body.postcode,
			arrival: req.body.arrival,
			departure: req.body.departure,
			timetable: req.body.timetable
		};
		mobileModel.createMobile(mobile).then(mobile => res.status(201).json({ mobile }));
	}
);

/**
 *  @swagger
 *  /api/stops:
 *      summary: Update a mobile library stop
 *      put:
 *          tags:
 *              -   stops
 *          description: Update a mobile library stop
 *          responses: 
 *              200:
 *                  description: Mobile library stop updated
 *              422:
 *                  description: Validation error
 */
router.put('/',
	[check('id').isInt()],
	(req, res) => {
		const id = req.body.id;
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
		const keys = ['route_id', 'name', 'community', 'address', 'postcode', 'arrival', 'departure', 'timetable'];
		let stop = req.body;

		// Filter out any unrequired stuff
		Object.keys(stop).filter(key => !keys.includes(key)).forEach(key => delete stop[key]);
		stopModel.updateStop(id, stop).then(stop => res.status(200).json({ stop }));
	}
);

module.exports = router;