const express = require('express');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const session = require('express-session');
const sessionConfig = require('./config/session');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const staticRoutes = require('./routes/static');

const app = express();

// Security
app.use(helmet());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session(sessionConfig));

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

// 404
app.use((req, res) => {
    res.status(404).render('404.html');
});

module.exports = app;
