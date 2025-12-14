# Sử dụng Node.js image phiên bản 18
FROM node:18-alpine

# Thiết lập working directory
WORKDIR /app

# Cài đặt pnpm globally
RUN npm install -g pnpm@8.10.1

# Copy file package.json của workspace root
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy các thư mục chính trước
COPY Be/ ./Be/
COPY app/ ./app/
COPY web/ ./web/

# Cài đặt dependencies ở root
RUN pnpm install

# Di chuyển vào thư mục Be và cài đặt dependencies
RUN cd Be && pnpm install && npx prisma generate

# Di chuyển vào thư mục app (mobile) và cài đặt dependencies
RUN cd app && pnpm install

# Di chuyển vào thư mục web/apps và cài đặt dependencies
RUN cd web/apps && pnpm install

# Copy toàn bộ source code còn lại (bao gồm cả file .env)
COPY . .

# Quay trở lại thư mục root
WORKDIR /app

# Mở port cho backend (8000) và frontend (3000)
EXPOSE 3000 8000

# Command để chạy development server
CMD ["pnpm", "dev"]