const knex = require('knex');
const path = require('path');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Knex database configuration
 * - Development: SQLite (file-based, no server needed)
 * - Production: PostgreSQL (Railway provides DATABASE_URL)
 */
const config = isProduction
    ? {
        // Production: PostgreSQL via Railway
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        },
        migrations: {
            directory: path.join(__dirname, '..', 'migrations')
        },
        seeds: {
            directory: path.join(__dirname, '..', 'seeds')
        }
    }
    : {
        // Development: SQLite
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, '..', 'database.db')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(__dirname, '..', 'migrations')
        },
        seeds: {
            directory: path.join(__dirname, '..', 'seeds')
        }
    };

const db = knex(config);

/**
 * Initialize database (create tables if not exist)
 */
async function initializeDatabase() {
    try {
        if (isProduction) {
            console.log('[DB] Using PostgreSQL in production');
            // Railway creates the database, we just connect
        } else {
            console.log('[DB] Using SQLite in development');
        }
        return db;
    } catch (error) {
        console.error('[DB] Error initializing database:', error);
        throw error;
    }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
    try {
        console.log('[DB] Running migrations...');
        const [batchNo, log] = await db.migrate.latest();

        if (log.length === 0) {
            console.log('[DB] Database is up to date (no migrations needed)');
        } else {
            console.log('[DB] Executed migrations:');
            log.forEach(migration => console.log(`  - ${migration}`));
        }
    } catch (error) {
        console.error('[DB] Error running migrations:', error);
        throw error;
    }
}

/**
 * Seed database if empty (both dev and production)
 * On Railway/production, force seed on startup to ensure admin user exists
 */
async function seedDatabase() {
    try {
        // Try to check if users table has data
        try {
            const userCount = await db('users').count('* as count').first();
            const count = parseInt(userCount.count, 10);

            if (count > 0) {
                console.log(`[DB] Database already has ${count} users, skipping seed`);
                return;
            }
        } catch (tableError) {
            // Table doesn't exist yet or other query error - continue to seed
            console.log('[DB] Cannot query users table (likely not created), will attempt seed');
        }

        // If we reach here, either table is empty or doesn't exist - seed it
        console.log('[DB] Running database seeds...');
        await db.seed.run();
        console.log('[DB] ✓ Seeds executed successfully - admin user is ready');
        console.log('[DB]   Login: admin / admin123');

    } catch (error) {
        console.error('[DB] Error seeding database:', error);
        // Don't throw - allow app to continue even if seed fails
        console.error('[DB] ⚠️  Could not auto-seed - you may need to run: npm run seed');
    }
}

/**
 * Close database connection (graceful shutdown)
 */
async function closeDatabase() {
    try {
        await db.destroy();
        console.log('[DB] Database connection closed');
    } catch (error) {
        console.error('[DB] Error closing database:', error);
    }
}

// Export db as default export for backward compatibility with models
module.exports = db;

// Export utility functions as named exports for server.js
module.exports.initializeDatabase = initializeDatabase;
module.exports.runMigrations = runMigrations;
module.exports.seedDatabase = seedDatabase;
module.exports.closeDatabase = closeDatabase;
