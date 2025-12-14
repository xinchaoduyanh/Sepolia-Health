#!/bin/bash

# Create logs directory
mkdir -p logs

echo "🚀 Starting Sepolia-Health with PM2..."

# Stop existing processes
pm2 delete all

# Start backend
echo "📡 Starting Backend (NestJS) on port 8000..."
cd Be
pm2 start "npm run dev" --name sepolia-backend --log ../logs/backend.log --out ../logs/backend-out.log --err ../logs/backend-error.log
cd ..

# Start frontend
echo "🌐 Starting Frontend (Next.js) on port 3000..."
cd web/apps
pm2 start "npm run dev" --name sepolia-frontend --log ../../logs/frontend.log --out ../../logs/frontend-out.log --err ../../logs/frontend-error.log
cd ../..

# Save PM2 configuration
pm2 save

echo "✅ Services started!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "📋 Logs:"
echo "  Backend: npm run pm2:logs:backend"
echo "  Frontend: npm run pm2:logs:frontend"
echo "  All: npm run pm2:logs"
echo ""
echo "🛑 Stop: npm run pm2:stop"
echo "🔄 Restart: npm run pm2:restart"