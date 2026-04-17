const express = require('express');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const session = require('express-session');
const sessionConfig = require('./config/session');
const { detectAjax } = require('./middleware/ajax');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const staticRoutes = require('./routes/static');

const app = express();

// Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "wss:", "ws:"], // Allow WebSocket
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session(sessionConfig));

// AJAX detection
app.use(detectAjax);

// Make user available in all templates
app.use((req, res, next) => {
    // Pass username to all templates if authenticated
    res.locals.user = req.session.username || null;
    res.locals.session = {
        userId: req.session.userId || null,
        username: req.session.username || null
    };
    next();
});

// Add admin detection middleware
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const Role = require('./models/Role');
            const isAdmin = await Role.hasRole(req.session.userId, 'admin');
            res.locals.isAdmin = isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            res.locals.isAdmin = false;
        }
    } else {
        res.locals.isAdmin = false;
    }
    next();
});

// Templates
nunjucks.configure('src/views', {
    autoescape: true,
    express: app
});

// Routes
app.use('/', staticRoutes);
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', postsRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).render('404.html');
});

module.exports = app;
