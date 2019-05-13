const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const stopModel = require('../models/stop');

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