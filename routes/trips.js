const express = require('express');
const router = express.Router();

const tripModel = require('../models/trip');

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