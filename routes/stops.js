const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const stopModel = require('../models/stop');

//
router.get('/', function (req, res, next) {

	// Parameters
	const organisation_ids = req.query.organisation_ids || null;
	const mobile_ids = req.query.mobile_ids || null;
	const route_ids = req.query.route_ids || null;
	const longitude = req.query.longitude || null;
	const latitude = req.query.latitude || null;
	const distance = req.query.distance || 1;
	const limit = req.query.limit || 1000;
	const page = req.query.page || 1;
	const sort = req.query.sort || 'id';

	stopModel.getStops(organisation_ids, mobile_ids, route_ids, longitude, latitude, distance, limit, page, sort).then(stops => {
		// We are going to set content headers to set the paging values
		res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page');
		res.setHeader('X-Total-Count', stops.length > 0 ? stops[0].total : 0);
		res.setHeader('X-Page', page);
		stops = stops.map(({ total, ...stop }) => stop); // Remove total column
		res.json(stops);
	});
});

//
router.get('/:id', function (req, res, next) {

	stopModel.getStopById(req.params.id)
		.then(stop => {
			if (stop != null) return res.json(stop);
			res.status(404).json({
				"errors": [{ "status": "404", "title": "Not Found" }]
			});
		});
});

//
router.get('/:id/pdf', function (req, res, next) {
	stopModel.getStopPdfById(req.params.id)
		.then(doc => {
			res.setHeader('Content-type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=' + req.params.id + '.pdf');
			let chunks = []
			let result;

			doc.on('data', function (chunk) {
				chunks.push(chunk)
			});
			
			doc.on('end', function () {
				result = Buffer.concat(chunks);
				res.send(result)
			});
			
			doc.end()
		});
});

//
router.get('/:z/:x/:y.mvt', async (req, res) => {
	const { z, x, y } = req.params;
	stopModel.getTileData(x, y, z).then(tile => {
		res.setHeader('Content-Type', 'application/x-protobuf');
		if (!tile) return res.status(204).send(null);
		res.send(tile);
	});
});

//
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

//
router.put('/:id',
	[check('id').isInt()],
	(req, res) => {
		const id = req.query.id;
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