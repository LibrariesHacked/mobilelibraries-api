const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const mobileModel = require('../models/mobile');

//
router.get('/', (req, res) => {
	// There may be an organisation ID
	if (req.query.organisation_id) {
		mobileModel.getMobilesByOrganisationId(req.query.organisation_id).then(mobiles => res.json(mobiles));
	} else {
		mobileModel.getMobiles().then(mobiles => res.json(mobiles));
	}
});

//
router.get('/locations', (req, res) => {
	mobileModel.getMobileLocations().then(locations => res.json(locations));
});

//
router.get('/nearest', (req, res) => {
	const longitude = req.query.longitude || null;
	const latitude = req.query.latitude || null;
	const distance = req.query.distance || null;
	mobileModel.getMobilesWithinDistance(longitude, latitude, distance).then(mobiles => res.json(mobiles));
});

//
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

//
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

//
router.put('/:id',
	[check('id').isInt()],
	(req, res) => {
		const id = req.query.id;
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