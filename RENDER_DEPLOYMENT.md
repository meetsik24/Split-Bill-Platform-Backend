# 🚀 Render Deployment Guide

## Quick Deploy to Render

### 1. **Connect Your GitHub Repository**

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select the repository: `meetsik24/Split-Bill-Platform-Backend`

### 2. **Configure Web Service**

**Basic Settings:**
- **Name**: `split-bill-platform` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (root of repo)

**Build & Deploy:**
- **Build Command**: `npm run render:build`
- **Start Command**: `npm start`

### 3. **Set Environment Variables**

Click **"Environment"** and add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Port (Render will override) |
| `BRIQ_API_KEY` | `your_key_here` | Briq SMS API key |
| `BRIQ_SENDER_ID` | `your_sender_id` | Briq sender ID |
| `AT_USERNAME` | `your_username` | Africa's Talking username |
| `AT_API_KEY` | `your_api_key` | Africa's Talking API key |
| `AT_ENVIRONMENT` | `production` | AT environment |
| `JWT_SECRET` | `your_secret` | JWT signing secret |
| `RATE_LIMIT_MAX` | `100` | Rate limit max requests |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |

**Important:** Don't set `DATABASE_URL` - Render will provide this automatically.

### 4. **Create PostgreSQL Database**

1. Click **"New +"** → **"PostgreSQL"**
2. **Name**: `split-bill-db`
3. **Database**: `splitbill`
4. **User**: Auto-generated
5. **Region**: Same as web service
6. **Plan**: Free (or choose based on needs)

### 5. **Link Database to Web Service**

1. Go back to your web service
2. Click **"Environment"**
3. Click **"Link"** next to your PostgreSQL service
4. Render will automatically add `DATABASE_URL`

### 6. **Deploy**

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Build TypeScript
   - Start the service

## 🔧 **Post-Deployment Setup**

### 1. **Run Database Migrations**

After first deployment, run migrations:

```bash
# Get your service URL from Render dashboard
# Example: https://your-app.onrender.com

# Run migrations via Render shell or SSH
npx drizzle-kit push:pg --schema ./src/db/schema.ts --connectionString $DATABASE_URL --driver pg
```

### 2. **Test Your Endpoints**

```bash
# Health check
curl https://your-app.onrender.com/health

# USSD health
curl https://your-app.onrender.com/api/v1/ussd/health

# SMS health
curl https://your-app.onrender.com/api/v1/sms/health
```

### 3. **Configure Africa's Talking**

**Callback URL:**
```
https://your-app.onrender.com/api/v1/ussd
```

**Method:** `POST`

## 📱 **Your USSD Flow URLs**

- **USSD Endpoint**: `https://your-app.onrender.com/api/v1/ussd`
- **Health Check**: `https://your-app.onrender.com/health`
- **API Base**: `https://your-app.onrender.com/api/v1`

## 🚨 **Important Notes**

1. **Free Tier Limitations**:
   - Service sleeps after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Perfect for development/testing

2. **Production Considerations**:
   - Upgrade to paid plan for 24/7 uptime
   - Add custom domain
   - Set up monitoring and alerts

3. **Environment Variables**:
   - Never commit `.env` files
   - Use Render's environment variable system
   - Keep secrets secure

## 🔍 **Troubleshooting**

### **Build Failures**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

### **Database Connection Issues**
- Verify `DATABASE_URL` is linked
- Check database service is running
- Run migrations after deployment

### **Service Not Starting**
- Check start command: `npm start`
- Verify `dist/` folder exists after build
- Check environment variables

## 📊 **Monitoring**

- **Logs**: View in Render dashboard
- **Metrics**: CPU, memory, response times
- **Alerts**: Set up notifications for failures

## 🎯 **Next Steps**

1. **Deploy to Render** using this guide
2. **Test all endpoints** after deployment
3. **Configure Africa's Talking** with your callback URL
4. **Set up Briq SMS** API keys
5. **Test complete USSD flow**

Your Split-Bill Platform will be live and accessible worldwide! 🌍
