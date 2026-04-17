const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');

// GET /signup - Show signup form
router.get('/signup', (req, res) => {
    res.render('signup.html');
});

// POST /signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation: username (3-20 alphanumeric)
        if (!username || username.length < 3 || username.length > 20) {
            return res.render('signup.html', {
                error: 'Username must be 3-20 characters'
            });
        }

        // Validation: password (8+ characters)
        if (!password || password.length < 8) {
            return res.render('signup.html', {
                error: 'Password must be at least 8 characters'
            });
        }

        // Check if username already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.render('signup.html', {
                error: 'Username already exists. Choose a different one.'
            });
        }

        // Hash password
        const passwordHash = await bcryptjs.hash(password, 10);

        // Create user
        const userId = await User.create(username, passwordHash);

        // Assign default 'create' role to new user
        await Role.assign(userId, 'create');

        // Redirect to login
        res.redirect('/login');

    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup.html', {
            error: 'Registration failed. Please try again.'
        });
    }
});

// GET /login - Show login form
router.get('/login', (req, res) => {
    res.render('login.html');
});

// POST /login - Authenticate user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation: both fields required
        if (!username || !password) {
            return res.render('login.html', {
                error: 'Username and password are required'
            });
        }

        // Find user by username
        const user = await User.findByUsername(username);
        if (!user) {
            return res.render('login.html', {
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const passwordMatch = await bcryptjs.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.render('login.html', {
                error: 'Invalid username or password'
            });
        }

        // Password correct - create session
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.render('login.html', {
                    error: 'Login failed. Please try again.'
                });
            }

            // Store user info in session
            req.session.userId = user.id;
            req.session.username = user.username;

            // Save session before redirecting to ensure it's persisted
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Session save error:', saveErr);
                    return res.render('login.html', {
                        error: 'Login failed. Please try again.'
                    });
                }
                // Redirect to main page
                res.redirect('/');
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.render('login.html', {
            error: 'Login failed. Please try again.'
        });
    }
});

// GET /logout - Destroy session and logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        // Redirect to main page
        res.redirect('/');
    });
});

module.exports = router;
