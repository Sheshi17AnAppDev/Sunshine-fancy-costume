const express = require('express');
const router = express.Router();
const { getSiteContentPublic } = require('../controllers/siteContentController');

router.get('/:key', getSiteContentPublic);

module.exports = router;
