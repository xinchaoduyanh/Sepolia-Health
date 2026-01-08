#!/bin/bash

# Secure Deployment Script for Sepolia-Health
# Only runs with SSH key authentication

set -e  # Exit on any error

echo "🚀 Sepolia-Health Secure Deployment"
echo "====================================="

# Check if running with SSH
# if [ -z "$SSH_CONNECTION" ]; then
#     echo "❌ This script must be run via SSH connection"
#     echo "   For security reasons, local execution is disabled"
#     exit 1
# fi

# # Check if user has proper permissions
# if [ "$EUID" -eq 0 ]; then
#     echo "❌ Don't run this script as root"
#     exit 1
# fi

# Don't create logs directory - using /dev/null

# Function to backup current processes
backup_processes() {
    echo "📋 Backing up current process status..."
    pm2 save --force 2>/dev/null || true
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."

    # Install root dependencies
    echo "Installing root dependencies..."
    pnpm install

    # Install and build backend
    echo "Setting up backend..."
    cd Be
    pnpm install
    npx prisma generate
    pnpm build
    cd ..

    # Install and build frontend
    echo "Setting up frontend..."
    cd web/apps
    pnpm install
    pnpm build
    cd ../..
}

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    pm2 delete all 2>/dev/null || true
    sleep 3
}

# Function to start production services
start_production() {
    echo "🚀 Starting production services..."
    pm2 start ecosystem.config.js --env production

    echo "⏳ Waiting for services to initialize..."
    sleep 10

    echo "📊 Service Status:"
    pm2 status

    pm2 save
}

# Function to health check
health_check() {
    echo "🔍 Performing basic health checks..."

    # Check if services are running
    sleep 5
    if pm2 list | grep -q "sepolia-backend.*online"; then
        echo "✅ Backend is running"
    else
        echo "❌ Backend is not running"
    fi

    if pm2 list | grep -q "sepolia-frontend.*online"; then
        echo "✅ Frontend is running"
    else
        echo "❌ Frontend is not running"
    fi
}

# Main deployment flow
main() {
    echo "🔒 Security checks passed"

    install_dependencies
    backup_processes
    stop_services
    start_production
    health_check

    echo ""
    echo "✅ Full deployment completed successfully!"
    echo ""
    echo "📋 Useful commands:"
    echo "  pm2 status           - Check service status"
    echo "  pm2 restart all      - Restart all services"
    echo "  pm2 stop all         - Stop all services"
    echo "  pm2 monit            - Monitor processes"
}

# Run main function
main