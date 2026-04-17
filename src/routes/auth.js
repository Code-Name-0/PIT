const express = require('express');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('signup.html');
});

router.post('/signup', (req, res) => {
    // Implemented in Phase 3
    res.json({ success: false, error: 'Not implemented yet' });
});

router.get('/login', (req, res) => {
    res.render('login.html');
});

router.post('/login', (req, res) => {
    // Implemented in Phase 3
    res.json({ success: false, error: 'Not implemented yet' });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
