const express = require('express');
const router = express.Router();

/**
 *  @swagger
 *  /api/organisations:
 *      get:
 *          description: Return all organisations
 *          responses: 
 *              200:
 *                  description: A list of organisations
 */
router.get('/', function (req, res, next) {
    res.json({ success: true });
});

module.exports = router; 