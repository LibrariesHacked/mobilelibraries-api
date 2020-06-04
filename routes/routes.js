const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const cache = require('../middleware/cache');
const routeModel = require('../models/route');

router.get('/', cache(3600), (req, res) => {
  routeModel.getRoutes(req.query.organisation_id).then(routes => res.json(routes));
});

router.get('/:id', cache(3600), (req, res) => {
  routeModel.getRouteById(req.params.id)
    .then(route => {
      if (route != null) {
        res.status(200).json(route);
      } else {
        res.status(404).json({
          "errors": [{ status: "404", title: "Not Found" }]
        });
      }
    });
});

router.post('/',
  [
    check('mobile_id').isInt(),
    check('name').isAlphanumeric()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
    const route = {
      mobile_id: req.body.mobile_id,
      name: req.body.name,
      frequency: req.body.frequency,
      start: req.body.start,
      end: req.body.end,
      timetable: req.body.timetable
    };
    routeModel.createRoute(route).then(route => res.status(201).json({ route }));
  }
);

router.put('/:id',
  [
    check('id').isInt()
  ],
  (req, res) => {
    const id = req.query.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ status: "422", title: "Input validation error", errors: errors.array() });
    const keys = ['name', 'mobile_id', 'timetable', 'frequency', 'start', 'end'];
    let route = req.body;
    Object.keys(route).filter(key => !keys.includes(key)).forEach(key => delete route[key]);
    routeModel.updateRoute(id, route).then(route => res.status(200).json({ route }));
  }
);

module.exports = router;