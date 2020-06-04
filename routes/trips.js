const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const tripModel = require('../models/trip');

router.get('/', cache(3600), (req, res) => {
  tripModel.getTrips().then(trips => res.json(trips));
});

router.get('/:id', cache(3600), function (req, res, next) {
  tripModel.getTripById(req.params.id)
    .then(trip => {
      if (trip != null) return res.json(trip);
      res.status(404).json({
        "errors": [{ "status": "404", "title": "Not Found" }]
      });
    });
});

router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params;
  tripModel.getTileData(x, y, z).then(tile => {
    res.setHeader('Content-Type', 'application/x-protobuf');
    if (!tile) return res.status(204).send(null);
    res.send(tile);
  });
});

module.exports = router;