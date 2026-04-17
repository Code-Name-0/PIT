const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const db = require('./database');

const isProduction = process.env.NODE_ENV === 'production';

let sessionStore;

if (isProduction) {
    // Production: use PostgreSQL session store
    // Pass the knex pool directly - connect-pg-simple will use it
    sessionStore = new pgSession({
        pool: db.client.pool || db.client,
        tableName: 'session',
        pruneSessionInterval: 60 // prune expired sessions every 60 seconds
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
