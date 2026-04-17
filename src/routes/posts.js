const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/liste', async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ajouter', (req, res) => {
    // Implemented in Phase 4
    res.json({ success: false, error: 'Not implemented yet' });
});

router.post('/effacer', (req, res) => {
    // Implemented in Phase 4
    res.json({ success: false, error: 'Not implemented yet' });
});

module.exports = router;
