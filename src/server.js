require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const db = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Run migrations
        await db.migrate.latest();
        console.log('✓ Database migrated');

        // Load HTTPS certificates
        const key = fs.readFileSync(path.join('src/certs/key.pem'));
        const cert = fs.readFileSync(path.join('src/certs/cert.pem'));

        // Start HTTPS server
        const server = https.createServer({ key, cert }, app);
        server.listen(PORT, () => {
            console.log(`✓ Server running on https://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}

startServer();
