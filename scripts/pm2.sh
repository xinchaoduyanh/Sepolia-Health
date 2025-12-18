#!/bin/bash

# PM2 Management Script for Sepolia-Health

# Create logs directory if it doesn't exist
mkdir -p logs

case "$1" in
  "start")
    echo "🚀 Starting Sepolia-Health in production mode..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    echo "✅ Production services started!"
    echo "📊 View status with: npm run pm2:status"
    ;;
  "start:dev")
    echo "🛠️ Starting Sepolia-Health in development mode..."
    pm2 start ecosystem.dev.config.js
    echo "✅ Development services started!"
    echo "📊 View status with: npm run pm2:status"
    ;;
  "stop")
    echo "🛑 Stopping all Sepolia-Health services..."
    pm2 delete all
    echo "✅ All services stopped!"
    ;;
  "restart")
    echo "🔄 Restarting all Sepolia-Health services..."
    pm2 restart all
    echo "✅ All services restarted!"
    ;;
  "reload")
    echo "🔄 Reloading Sepolia-Health without downtime..."
    pm2 reload all
    echo "✅ Services reloaded!"
    ;;
  "status")
    echo "📊 Sepolia-Health Services Status:"
    pm2 status
    ;;
  "logs")
    echo "📋 Viewing logs..."
    pm2 logs
    ;;
  "logs:backend")
    echo "📋 Backend logs:"
    pm2 logs sepolia-backend
    ;;
  "logs:frontend")
    echo "📋 Frontend logs:"
    pm2 logs sepolia-frontend
    ;;
  "logs:mobile")
    echo "📋 Mobile logs:"
    pm2 logs sepolia-mobile-dev
    ;;
  "monitor")
    echo "🖥️ Opening PM2 Monitor..."
    pm2 monit
    ;;
  "build")
    echo "🔨 Building all projects..."
    echo "Building backend..."
    cd Be && npm run build && cd ..
    echo "Building frontend..."
    cd web/apps && npm run build && cd ../..
    echo "✅ Build completed!"
    ;;
  "deploy")
    echo "🚀 Deploying to production..."
    pm2 deploy production
    ;;
  "help")
    echo "Sepolia-Health PM2 Management Script"
    echo ""
    echo "Usage: npm run pm2:<command>"
    echo ""
    echo "Commands:"
    echo "  start          Start production services"
    echo "  start:dev      Start development services"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  reload         Reload without downtime"
    echo "  status         Show service status"
    echo "  logs           Show all logs"
    echo "  logs:backend   Show backend logs"
    echo "  logs:frontend  Show frontend logs"
    echo "  logs:mobile    Show mobile logs"
    echo "  monitor        Open PM2 monitor"
    echo "  build          Build all projects"
    echo "  deploy         Deploy to production"
    echo "  help           Show this help message"
    ;;
  *)
    echo "❌ Unknown command: $1"
    echo "Use 'npm run pm2:help' for available commands"
    exit 1
    ;;
esac