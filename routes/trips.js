const express = require('express');
const router = express.Router();

const tripModel = require('../models/trip');

//
router.get('/', (req, res) => {
	tripModel.getTrips().then(trips => res.json(trips));
});

//
router.get('/:id', function (req, res, next) {
	tripModel.getTripById(req.params.id)
		.then(trip => {
			if (trip != null) return res.json(trip);
			res.status(404).json({
				"errors": [{ "status": "404", "title": "Not Found" }]
			});
		});
});

//
router.get('/:z/:x/:y.mvt', async (req, res) => {
	const { z, x, y } = req.params;
	tripModel.getTileData(x, y, z).then(tile => {
		res.setHeader('Content-Type', 'application/x-protobuf');
		if (!tile) return res.status(204).send(null);
		res.send(tile);
	});
});

module.exports = router;