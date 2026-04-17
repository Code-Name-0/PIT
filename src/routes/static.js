const express = require('express');
const router = express.Router();

router.use('/css', express.static('src/public/css'));
router.use('/js', express.static('src/public/js'));

module.exports = router;
