const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./database');

const isProduction = process.env.NODE_ENV === 'production';

let sessionStore;

if (isProduction) {
    // Production: use PostgreSQL session store
    sessionStore = new pgSession({
        pool: db.client,
        tableName: 'session'
    });
} else {
    // Development: use default memory store (fine for dev)
    sessionStore = new session.MemoryStore();
}

module.exports = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
};
