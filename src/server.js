require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Determine protocol based on NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';
const app = require('./app');
const { initializeDatabase, runMigrations, seedDatabase } = require('./config/database');
const PostItWebSocketServer = require('./ws/wsServer');

/**
 * Start HTTPS server in development, HTTP in production (Railway handles HTTPS via reverse proxy)
 */
async function start() {
    try {
        // Initialize and migrate database
        console.log('Initializing database...');
        const db = await initializeDatabase();

        // Run migrations
        console.log('Running migrations...');
        await runMigrations();

        // Seed database if needed
        console.log('Seeding database if needed...');
        await seedDatabase();

        console.log('Database initialized and migrated');

        // Determine port
        const PORT = process.env.PORT || 3000;

        let server;

        if (isProduction) {
            // Production: use HTTP (Railway reverse proxy handles HTTPS)
            console.log('Production mode: using HTTP (Railway handles HTTPS)');
            server = require('http').createServer(app);
        } else {
            // Development: use HTTPS with self-signed certificates
            console.log('Development mode: using HTTPS with self-signed certificates');

            const keyPath = path.join(__dirname, '..', 'certs', 'key.pem');
            const certPath = path.join(__dirname, '..', 'certs', 'cert.pem');

            // Check if certificates exist
            if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
                console.error('Self-signed certificates not found!');
                console.error('Generate them with:');
                console.error('openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=FR/ST=State/L=City/O=PostIt/CN=localhost"');
                process.exit(1);
            }

            const key = fs.readFileSync(keyPath, 'utf8');
            const cert = fs.readFileSync(certPath, 'utf8');
            server = require('https').createServer({ key, cert }, app);
        }

        // Initialize WebSocket server
        console.log('Initializing WebSocket server...');
        const wsServer = new PostItWebSocketServer(server);
        app.locals.wsServer = wsServer;
        console.log('WebSocket server initialized');

        // Start listening
        server.listen(PORT, () => {
            const protocol = isProduction ? 'http' : 'https';
            console.log(`\n========================================`);
            console.log(`Server started on ${protocol}://localhost:${PORT}`);
            if (!isProduction) {
                console.log(`Note: Using self-signed certificate (browser will warn)`);
            }
            console.log(`========================================\n`);
        });

        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received, shutting down gracefully...`);
            wsServer.shutdown();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
