# Troubleshooting Guide

## Common Issues and Solutions

### 1. Logger Transport Error

**Error:** `Failed to start server: Error: unable to determine transport target for "pino-pretty"`

**Solution:** The project now uses a simplified logger configuration that doesn't require external dependencies. This error should no longer occur.

**If you still see this error:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Database Connection Issues

**Error:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
```bash
# Check if Docker is running
docker info

# Check database container status
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### 3. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### 4. Environment Variables Not Loaded

**Error:** `DATABASE_URL is required` or similar validation errors

**Solutions:**
```bash
# Check if .env file exists
ls -la .env

# Create from template if missing
cp env.template .env

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### 5. Drizzle Migration Issues

**Error:** `relation "users" does not exist`

**Solutions:**
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# If tables exist but migrations fail, try:
npm run db:push
```

### 6. USSD Service Not Responding

**Issue:** USSD endpoint returns errors or doesn't process requests

**Debugging:**
```bash
# Check USSD service health
curl http://localhost:3000/api/v1/ussd/health

# View session information (development mode)
curl http://localhost:3000/api/v1/ussd/sessions/test-session

# Check server logs
npm run dev
```

### 7. SMS Service Issues

**Error:** SMS sending fails or returns errors

**Debugging:**
```bash
# Check SMS service health
curl http://localhost:3000/api/v1/sms/health

# Test SMS sending
curl -X POST http://localhost:3000/api/v1/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+255700000000","message":"Test message"}'
```

### 8. TypeScript Compilation Errors

**Error:** TypeScript compilation fails

**Solutions:**
```bash
# Check TypeScript configuration
npm run type-check

# Fix linting issues
npm run lint:fix

# Clean and rebuild
rm -rf dist
npm run build
```

### 9. Docker Issues

**Error:** Docker container fails to start or connect

**Solutions:**
```bash
# Check Docker status
docker info

# Clean up containers and volumes
docker-compose down -v
docker system prune -f

# Rebuild and start
docker-compose up --build -d
```

### 10. Permission Issues

**Error:** `EACCES: permission denied` or similar

**Solutions:**
```bash
# Fix file permissions
chmod +x start.sh
chmod +x test-ussd-flow.js

# If using npm globally, fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look at server logs and Docker logs for detailed error messages
2. **Verify environment:** Ensure all required environment variables are set correctly
3. **Check dependencies:** Make sure all required services (Node.js, Docker, PostgreSQL) are running
4. **Review configuration:** Verify database connection strings and API credentials
5. **Test step by step:** Use the test scripts to isolate where the issue occurs

## Development vs Production

- **Development:** Uses simplified logging, local database, debug endpoints
- **Production:** Structured logging, production database, no debug endpoints

Set `NODE_ENV=production` for production deployments.

## Health Check Endpoints

Use these endpoints to verify service health:

- **Overall Health:** `GET /health`
- **USSD Service:** `GET /api/v1/ussd/health`
- **SMS Service:** `GET /api/v1/sms/health`
- **Payment Service:** `GET /api/v1/payment/health`
