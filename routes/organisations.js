const express = require('express');
const router = express.Router();

// GET: /organisations/
router.get('/', function (req, res, next) {
    res.json({ success: true });
});

module.exports = router; 