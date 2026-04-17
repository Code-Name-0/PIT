# Railway Deployment Guide

## Prerequisites
- GitHub repository with this code pushed
- Railway account (free at railway.app)

## Step-by-Step Deployment

### 1. Create New Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "GitHub Repo" → connect your repo with this code

### 2. Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Wait for database to initialize (2-3 minutes)

### 3. Configure Environment Variables
In Railway project settings, add these variables:

```
NODE_ENV=production
SESSION_SECRET=generate-a-random-secure-string-here
PORT=3000
```

**Critical:** For `SESSION_SECRET`, generate a random string:
```bash
# On your computer, run this to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then copy the output and paste it as the value for `SESSION_SECRET`.

### 4. Verify Environment
- `DATABASE_URL` - Railway creates this automatically ✓
- `NODE_ENV` - Set to `production` ✓
- `SESSION_SECRET` - Must be set or sessions won't work ⚠️
- `PORT` - Railway assigns this automatically, but we set 3000 for consistency

### 5. Deploy
1. Push code to GitHub (Railway auto-deploys)
2. Watch the logs in Railway dashboard
3. You should see:
   ```
   Initializing database...
   Running migrations...
   Executed migrations: 001_create_users.js, 002_create_posts.js, 003_create_user_roles.js, 004_create_session_table.js
   Seeding database if needed...
   ✓ Seeds executed successfully - admin user is ready
     Login: admin / admin123
   Server started on http://localhost:3000
   ```

### 6. First Login
1. Visit your Railway domain (e.g., `https://aws-post-it-production.up.railway.app`)
2. Click "Login"
3. Use credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
4. You should see the navbar update with "Welcome, admin!" and logout button

## Troubleshooting

### Issue: Database is empty or admin doesn't exist
**Solution:**
- Check logs for "Seeds executed successfully"
- If not present, the seed didn't run
- Manually run: In Railway, open terminal/shell and run:
  ```bash
  npm run seed
  ```

### Issue: Login doesn't update navbar (navbar stays as "not logged in")
**Solution:**
- Check that `SESSION_SECRET` environment variable is set in Railway
- Without it, sessions aren't encrypted/persisted properly
- Add it and redeploy
- Clear browser cookies and try again

### Issue: WebSocket connection fails
**Solution:**
- Railway handles WebSocket connections automatically
- Check browser console for errors
- Ensure your Railway custom domain allows `wss://` (Secure WebSocket)

## Useful Commands

### View Logs
```bash
# In Railway dashboard, click "View Logs" to see real-time output
```

### Manual Seed (if needed)
```bash
# In Railway shell/terminal
npm run migrate
npm run seed
```

### Connect to Database
```bash
# Get DATABASE_URL from Railway
# Connect with psql or any PostgreSQL client
psql "your-database-url"
```

## Free Tier Limits
- **500 CPU hours/month** (plenty for a small app)
- **5 GB persistent disk** (plenty for posts)
- **After 500 hours:** ~$5/month billed on your credit card
- First month includes **$5 free credit**

Your app will work **free forever** unless you get heavy traffic.

---

**Questions?** Check Railway docs: https://docs.railway.app
