const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

let sessionStore;

if (isProduction) {
    // Production: use PostgreSQL session store with native pg pool
    // connect-pg-simple requires a native pg.Pool, not a Knex client
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    sessionStore = new pgSession({
        pool: pool,
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
        secure: 'auto', // 'auto' respects trust proxy + X-Forwarded-Proto header
        httpOnly: true,
        sameSite: 'lax', // changed from 'strict' to allow cross-site redirects
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
};
