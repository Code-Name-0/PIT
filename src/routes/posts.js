const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Role = require('../models/Role');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role-check');

// GET /liste - Return all posts as JSON (no auth required, public read)
router.get('/liste', async (req, res) => {
    try {
        const posts = await Post.findAll();

        // Ensure posts are in correct format for frontend
        const formattedPosts = posts.map(post => ({
            id: post.id,
            text: post.text,
            author: post.author,
            author_id: post.author_id,
            x: post.x,
            y: post.y,
            created_at: post.created_at,
            updated_at: post.updated_at
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch posts' });
    }
});

// POST /ajouter - Create new post-it (requires 'create' role)
router.post('/ajouter', requireRole('create'), async (req, res) => {
    try {
        const { text, x, y } = req.body;
        const userId = req.session.userId;

        // Validation: text (1-500 chars)
        if (!text || typeof text !== 'string') {
            const error = 'Text is required';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ success: false, error });
            }
            return res.redirect('/');
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0 || trimmedText.length > 500) {
            const error = 'Text must be 1-500 characters';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Validation: x (0-10000)
        const xCoord = parseFloat(x);
        if (isNaN(xCoord) || xCoord < 0 || xCoord > 10000) {
            const error = 'X coordinate must be between 0 and 10000';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Validation: y (0-10000)
        const yCoord = parseFloat(y);
        if (isNaN(yCoord) || yCoord < 0 || yCoord > 10000) {
            const error = 'Y coordinate must be between 0 and 10000';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Insert post into database
        const postId = await Post.create(trimmedText, userId, xCoord, yCoord);

        // Fetch created post for response
        const createdPost = await Post.findById(postId);

        // BROADCAST WebSocket event to all clients
        const wsServer = req.app.locals.wsServer;
        if (wsServer) {
            wsServer.broadcast({
                type: 'post-created',
                data: createdPost
            });
        }

        // Check if AJAX request
        const isAjax = req.headers['content-type']?.includes('application/json') ||
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest';

        if (isAjax) {
            // AJAX: return JSON
            return res.json({
                success: true,
                post: createdPost
            });
        } else {
            // Non-AJAX: redirect to main page
            return res.redirect('/');
        }

    } catch (error) {
        console.error('Error creating post:', error);

        const isAjax = req.headers['content-type']?.includes('application/json') ||
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest';

        if (isAjax) {
            return res.status(500).json({ success: false, error: 'Failed to create post' });
        } else {
            return res.redirect('/');
        }
    }
});

// POST /effacer - Delete post-it (requires 'delete' role + ownership check)
router.post('/effacer', requireRole('delete'), async (req, res) => {
    try {
        const { post_id } = req.body;
        const userId = req.session.userId;

        // Validation: post_id required
        if (!post_id) {
            const error = 'Post ID is required';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(400).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Fetch post to verify ownership
        const post = await Post.findById(post_id);

        if (!post) {
            const error = 'Post not found';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(404).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Authorization: user must be post author OR admin
        const isAdmin = await Role.hasRole(userId, 'admin');

        if (post.author_id !== userId && !isAdmin) {
            const error = 'You can only delete your own posts';
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(403).json({ success: false, error });
            }
            return res.redirect('/');
        }

        // Delete post from database
        await Post.delete(post_id);

        // BROADCAST WebSocket event to all clients
        const wsServer = req.app.locals.wsServer;
        if (wsServer) {
            wsServer.broadcast({
                type: 'post-deleted',
                data: { id: post_id }
            });
        }

        // Check if AJAX request
        const isAjax = req.headers['content-type']?.includes('application/json') ||
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest';

        if (isAjax) {
            // AJAX: return JSON
            return res.json({ success: true });
        } else {
            // Non-AJAX: redirect to main page
            return res.redirect('/');
        }

    } catch (error) {
        console.error('Error deleting post:', error);

        const isAjax = req.headers['content-type']?.includes('application/json') ||
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest';

        if (isAjax) {
            return res.status(500).json({ success: false, error: 'Failed to delete post' });
        } else {
            return res.redirect('/');
        }
    }
});

// POST /modifier - Edit post (requires 'modify' role + ownership check)
router.post('/modifier', requireRole('modify'), async (req, res) => {
    try {
        const { post_id, text } = req.body;
        const userId = req.session.userId;

        // Validation: text (1-500 chars)
        if (!text || typeof text !== 'string') {
            const error = 'Text is required';
            return res.status(400).json({ success: false, error });
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0 || trimmedText.length > 500) {
            const error = 'Text must be 1-500 characters';
            return res.status(400).json({ success: false, error });
        }

        // Fetch post to verify ownership
        const post = await Post.findById(post_id);

        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        // Authorization: user must be post author OR admin
        const isAdmin = await Role.hasRole(userId, 'admin');

        if (post.author_id !== userId && !isAdmin) {
            return res.status(403).json({ success: false, error: 'You can only edit your own posts' });
        }

        // Update post in database
        await Post.update(post_id, trimmedText);

        // Fetch updated post
        const updatedPost = await Post.findById(post_id);

        // BROADCAST WebSocket event to all clients
        const wsServer = req.app.locals.wsServer;
        if (wsServer) {
            wsServer.broadcast({
                type: 'post-updated',
                data: {
                    id: updatedPost.id,
                    text: updatedPost.text,
                    updated_at: updatedPost.updated_at
                }
            });
        }

        // Return updated post
        return res.json({
            success: true,
            post: updatedPost
        });

    } catch (error) {
        console.error('Error editing post:', error);
        return res.status(500).json({ success: false, error: 'Failed to edit post' });
    }
});

// POST /position - Update post position (x, y coordinates)
router.post('/position', async (req, res) => {
    try {
        const { post_id, x, y } = req.body;
        const userId = req.session.userId;

        // Validation: post_id required
        if (!post_id) {
            return res.status(400).json({ success: false, error: 'Post ID is required' });
        }

        // Validation: x coordinate (0-10000)
        const xCoord = parseFloat(x);
        if (isNaN(xCoord) || xCoord < 0 || xCoord > 10000) {
            return res.status(400).json({ success: false, error: 'X coordinate must be between 0 and 10000' });
        }

        // Validation: y coordinate (0-10000)
        const yCoord = parseFloat(y);
        if (isNaN(yCoord) || yCoord < 0 || yCoord > 10000) {
            return res.status(400).json({ success: false, error: 'Y coordinate must be between 0 and 10000' });
        }

        // Fetch post to verify existence and ownership (if needed)
        const post = await Post.findById(post_id);

        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }

        // Update position in database
        await Post.updatePosition(post_id, xCoord, yCoord);

        // Fetch updated post
        const updatedPost = await Post.findById(post_id);

        // Return updated post
        return res.json({
            success: true,
            post: updatedPost
        });

    } catch (error) {
        console.error('Error updating post position:', error);
        return res.status(500).json({ success: false, error: 'Failed to update post position' });
    }
});

module.exports = router;
