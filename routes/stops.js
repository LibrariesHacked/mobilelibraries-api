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
 *          responses: 
 *              200:
 *                  description: A list of stops
 */
router.get('/', function (req, res, next) {

	// Paging parameters
	const limit = req.query.limit || 1000;
	const page = req.query.page || 1;

	// Sorting parameters
	const sort = req.query.sort || 'id';

	// Filtering parameters
	const organisation_id = req.query.organisation_id || null;
	const mobile_id = req.query.mobile_id || null;
	const route_id = req.query.route_id || null;

    stopModel.getStops(organisation_id, mobile_id, route_id, limit, page, sort).then(stops => { res.json(stops) });
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