const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // Pass user info to template if authenticated
    const user = req.session.username || null;

    res.render('index.html', {
        user: user
    });
});

module.exports = router;
