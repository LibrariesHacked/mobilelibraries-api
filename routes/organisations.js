const express = require('express');
const router = express.Router();

const organisation = require('../models/organisation');

//
router.get('/', function (req, res, next) {
	organisation.getOrganisations().then(orgs => { res.json(orgs) });
});

//
router.get('/:id', function (req, res, next) {
	organisation.getOrganisationById(req.params.id)
		.then(org => {
			if (org != null) {
				res.json(org);
			} else {
				res.status(404).json({
					"errors": [{ "status": "404", "title": "Not Found" }]
				});
			}
		});
});

module.exports = router;