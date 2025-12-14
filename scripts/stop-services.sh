#!/bin/bash

echo ""
echo "====================================="
echo "  Stopping All PM2 Services"
echo "====================================="
echo ""

pm2 delete all

echo ""
echo "✅ All services stopped!"
echo ""