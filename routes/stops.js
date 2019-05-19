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
 *          produces:
 *              -   application/json
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
 *          produces:
 *              -   application/json
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
 *          produces:
 *              -   application/x-protobuf
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

module.exports = router;