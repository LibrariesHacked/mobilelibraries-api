const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const stopModel = require('../models/stop');


router.get('/:z/:x/:y.mvt', async (req, res) => {
	const { z, x, y } = req.params;
	stopModel.getTileData(x, y, z).then(tile => {
		res.setHeader('Content-Type', 'application/x-protobuf');
		if (!tile || tile.st_asmvt.length === 0) return res.status(204).send(null);
		res.send(tile.st_asmvt);
	});
});

module.exports = router;