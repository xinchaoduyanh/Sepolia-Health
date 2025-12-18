#!/bin/bash
echo "====================================="
echo "  Sepolia Health PM2 Safe Manager"
echo "====================================="

# 1. Dọn dẹp triệt để (Cực kỳ quan trọng cho lần chạy thứ 2)
echo "[1/4] Force cleaning processes..."
pm2 delete all > /dev/null 2>&1
# Giết tận gốc các tiến trình node chạy ngầm có thể gây treo CPU
sudo pkill -9 node
sleep 2

# 2. Chạy Backend với giới hạn RAM
echo "[2/4] Starting Backend..."
cd "$(dirname "$0")/../Be"
# Thêm giới hạn RAM 1.5GB để tránh tràn bộ nhớ gây sập SSH
pm2 start dist/src/main.js --name sepolia-backend --max-memory-restart 1500M --watch false

# 3. KHOẢNG NGHỈ "SỐNG CÒN"
# Cho Backend 10 giây để ổn định kết nối DB/Redis trước khi chạy FE
echo "Waiting 10s for Backend to stabilize (Avoiding 200% CPU spike)..."
sleep 10

# 4. Chạy Frontend Standalone
echo "[3/4] Starting Frontend..."
cd "../web/apps"
# Sử dụng trực tiếp file standalone server để nhẹ máy nhất
# Lưu ý: Nhớ copy public và static vào standalone như đã hướng dẫn
pm2 start start-server.js --name sepolia-frontend --max-memory-restart 1G

echo ""
pm2 status
pm2 save
echo "✅ Services started safely!"



