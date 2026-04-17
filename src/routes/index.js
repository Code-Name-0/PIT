const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index.html', {
        user: req.session.userId || null
    });
});

module.exports = router;
