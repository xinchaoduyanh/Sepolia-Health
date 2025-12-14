# PM2 Configuration for Sepolia-Health

## Installation

First, install PM2 globally:

```bash
npm install -g pm2
```

## Usage

### Development Mode

Start all services in development mode with hot reload:

```bash
npm run pm2:start:dev
```

This will start:
- Backend on port 8000 (with file watching)
- Frontend on port 3000 (with file watching)
- Mobile app on web mode (with file watching)

### Production Mode

Build and start all services in production mode:

```bash
# First build all projects
npm run pm2:build

# Then start production services
npm run pm2:start
```

## Available Commands

```bash
# Start services
npm run pm2:start        # Start production services
npm run pm2:start:dev    # Start development services

# Stop services
npm run pm2:stop         # Stop all services

# Manage services
npm run pm2:restart      # Restart all services
npm run pm2:reload       # Reload without downtime

# Monitor and logs
npm run pm2:status       # Show service status
npm run pm2:monitor      # Open PM2 monitor dashboard
npm run pm2:logs         # Show all logs
npm run pm2:logs:backend # Show backend logs only
npm run pm2:logs:frontend# Show frontend logs only
npm run pm2:logs:mobile  # Show mobile logs only

# Build and deploy
npm run pm2:build        # Build all projects
npm run pm2:deploy       # Deploy to production (configured)

# Help
npm run pm2:help         # Show all available commands
```

## Configuration Files

- `ecosystem.config.js` - Default production configuration
- `ecosystem.dev.config.js` - Development configuration with file watching
- `ecosystem.prod.config.js` - Production cluster mode configuration
- `scripts/pm2.sh` - Management script with all commands

## File Structure

```
├── ecosystem.config.js      # PM2 production config
├── ecosystem.dev.config.js  # PM2 development config
├── ecosystem.prod.config.js # PM2 cluster production config
├── scripts/
│   └── pm2.sh              # PM2 management script
├── logs/                   # PM2 log files (auto-created)
│   ├── backend.log
│   ├── frontend.log
│   └── mobile.log
└── .pm2ignore             # Files to ignore in PM2
```

## Environment Variables

PM2 will automatically load environment variables from:
- `Be/.env` for backend
- `web/apps/admin/.env.local` for frontend
- `app/.env` for mobile app

## Tips

1. **View real-time logs**: `npm run pm2:logs`
2. **Monitor performance**: `npm run pm2:monitor`
3. **Auto-restart on file changes**: Use `npm run pm2:start:dev`
4. **Zero-downtime reloads**: Use `npm run pm2:reload` in production
5. **Save PM2 configuration**: PM2 automatically saves after start/stop

## Troubleshooting

If services fail to start:

1. Check logs: `npm run pm2:logs`
2. Check individual service logs:
   - Backend: `npm run pm2:logs:backend`
   - Frontend: `npm run pm2:logs:frontend`
3. Ensure all dependencies are installed:
   ```bash
   pnpm install
   cd Be && pnpm install && npx prisma generate
   cd ../app && pnpm install
   cd ../web/apps && pnpm install
   ```
4. Check if ports are available:
   - Backend uses port 8000
   - Frontend uses port 3000