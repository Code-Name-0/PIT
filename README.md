# Post-it Social Application

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate self-signed HTTPS certificate (dev only):
   ```bash
   openssl req -nodes -new -x509 -keyout src/certs/key.pem -out src/certs/cert.pem
   ```

3. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Run migrations:
   ```bash
   npm run migrate
   ```

5. Start server:
   ```bash
   npm start
   ```

Server runs at https://localhost:3000

## Development

```bash
npm run dev
```

Uses nodemon for auto-reload.
