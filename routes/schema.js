const express = require('express');
const router = express.Router();

const schema = require('../models/schema');

const { Parser } = require('json2csv');

const csvtojson = require('csvtojson')

//
router.get('/', function (req, res, next) {
	if (req.accepts('text/csv')) {
		// option to request CSV data
		const fields = schema.getViewFields();
		const parser = new Parser({ fields });
		schema.getData().then(data => { res.send(parser.parse(data)) });
	} else { // else return JSON by default
		schema.getData().then(data => { res.json(data) });
	}
});

//
router.get('/:organisation_name', function (req, res, next) {
	const organisation_name = req.params.organisation_name;
	if (req.accepts('text/csv')) {
		const fields = schema.getViewFields();
		const parser = new Parser({ fields });
		schema.getData(organisation_name).then(data => { res.send(parser.parse(data)) });
	} else {
		schema.getData(organisation_name).then(data => { res.json(data) });
	}
});

//
router.post('/', function (req, res, next) {
	if (req.is('text/csv')) {
		csvtojson()
			.fromString(req.body)
			.then((schema_arr) => {
				schema.createData(schema_arr).then(() => { res.status(201).json({ rows: schema_arr.length }) });
			})
	} else {
		schema.createData(req.body).then(() => { res.status(201).json({ rows: req.body.length }) });
	}
});

// To do
router.put('/:organisation_name', function (req, res, next) {

});

// To do
router.delete('/:organisation_name', function (req, res, next) {

});

module.exports = router;