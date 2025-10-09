# 🏥 Sepolia-Health

Hệ thống quản lý phòng khám toàn diện với ứng dụng di động và backend API, được xây dựng bằng React Native (Expo) và NestJS.

## 📱 Tổng quan

Sepolia-Health là một giải pháp quản lý phòng khám hiện đại, cung cấp trải nghiệm đặt lịch khám bệnh thuận tiện cho bệnh nhân và công cụ quản lý hiệu quả cho nhân viên y tế.

## ✨ Tính năng chính

### 👤 Dành cho Bệnh nhân

- **Đăng ký/Đăng nhập** với xác thực email
- **Đặt lịch khám** trực tuyến với lựa chọn chuyên khoa và bác sĩ
- **Quản lý hồ sơ cá nhân** và thông tin sức khỏe
- **Quét QR code** để check-in nhanh chóng
- **Xem lịch sử khám bệnh** và đơn thuốc
- **Thanh toán trực tuyến** và theo dõi giao dịch

### 👨‍⚕️ Dành cho Bác sĩ

- **Quản lý lịch làm việc** và ca khám
- **Xem danh sách bệnh nhân** đã đặt lịch
- **Kê đơn thuốc** điện tử
- **Theo dõi phản hồi** từ bệnh nhân

### 🏢 Dành cho Lễ tân

- **Quản lý lịch hẹn** và xác nhận
- **Hỗ trợ bệnh nhân** check-in
- **Theo dõi thanh toán** và giao dịch

## 🛠️ Công nghệ sử dụng

### Frontend (Mobile App)

- **React Native** với Expo framework
- **TypeScript** cho type safety
- **Expo Router** cho navigation
- **NativeWind** (Tailwind CSS) cho styling
- **React Query** cho state management và caching
- **React Context** cho global state
- **Expo Linear Gradient** cho UI effects

### Backend (API)

- **NestJS** framework
- **TypeScript** cho type safety
- **Prisma** ORM với PostgreSQL
- **JWT** authentication
- **Redis** cho caching
- **AWS S3** cho file storage
- **Swagger** cho API documentation
- **Zod** cho validation

### Database

- **PostgreSQL** làm database chính
- **Redis** cho caching và session

## 📁 Cấu trúc dự án

```
Sepolia-Health/
├── app/                    # Mobile app (React Native + Expo)
│   ├── app/               # App screens và navigation
│   ├── components/        # Reusable components
│   ├── contexts/          # React Context providers
│   ├── lib/              # Utilities và API client
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Images và static files
├── Be/                   # Backend API (NestJS)
│   ├── src/
│   │   ├── common/       # Shared modules và utilities
│   │   ├── module/       # Feature modules
│   │   └── main.ts       # Application entry point
│   └── prisma/           # Database schema và migrations
├── admin/                # Admin dashboard (Future)
├── doctor/               # Doctor portal (Future)
└── reception/            # Reception portal (Future)
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js >= 18.0.0
- npm hoặc pnpm
- PostgreSQL database
- Redis server
- Expo CLI (cho mobile app)

### 1. Clone repository

```bash
git clone <repository-url>
cd Sepolia-Health
```

### 2. Cài đặt Backend

```bash
cd Be
npm install
# hoặc
pnpm install
```

### 3. Cấu hình Database

```bash
# Tạo file .env trong thư mục Be/
cp .env.example .env

# Chỉnh sửa các biến môi trường trong .env
DATABASE_URL="postgresql://username:password@localhost:5432/sepolia_health"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
```

### 4. Chạy Database migrations

```bash
cd Be
npx prisma generate
npx prisma db push
```

### 5. Chạy Backend API

```bash
cd Be
npm run start:dev
# API sẽ chạy tại http://localhost:3000
# Swagger docs tại http://localhost:3000/api/docs
```

### 6. Cài đặt Mobile App

```bash
cd app
npm install
```

### 7. Cấu hình Mobile App

```bash
# Tạo file .env trong thư mục app/
cp .env.example .env

# Chỉnh sửa API_BASE_URL trong .env
API_BASE_URL="http://localhost:3000/api"
```

### 8. Chạy Mobile App

```bash
cd app
npm start
# Quét QR code bằng Expo Go app trên điện thoại
# hoặc chạy trên simulator
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## 📱 Screenshots

### Mobile App

- **Trang chủ**: Dashboard với các tính năng chính
- **Đặt lịch**: Form đặt lịch khám với lựa chọn chuyên khoa và bác sĩ
- **Hồ sơ**: Quản lý thông tin cá nhân và sức khỏe
- **QR Scanner**: Quét mã QR để check-in
- **Tài khoản**: Thông tin người dùng và cài đặt

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/verify-email` - Xác thực email
- `POST /api/auth/refresh-token` - Làm mới token

### Appointments

- `GET /api/appointments/patient/my-appointments` - Lịch hẹn của bệnh nhân
- `POST /api/appointments` - Tạo lịch hẹn mới
- `PUT /api/appointments/:id` - Cập nhật lịch hẹn
- `DELETE /api/appointments/:id` - Hủy lịch hẹn

### Doctors

- `GET /api/doctor` - Danh sách bác sĩ
- `GET /api/doctor/services` - Dịch vụ của bác sĩ
- `GET /api/doctor/timeslot` - Lịch làm việc của bác sĩ

## 🗄️ Database Schema

### Các bảng chính

- **User**: Thông tin người dùng (bệnh nhân, bác sĩ, lễ tân, admin)
- **DoctorProfile**: Hồ sơ bác sĩ với chuyên khoa và kinh nghiệm
- **Appointment**: Lịch hẹn khám bệnh
- **Service**: Dịch vụ khám bệnh
- **Prescription**: Đơn thuốc
- **Medicine**: Thuốc trong hệ thống
- **Clinic**: Thông tin cơ sở phòng khám
- **Transaction**: Giao dịch thanh toán

## 🔐 Bảo mật

- **JWT Authentication** cho API access
- **Email verification** cho tài khoản mới
- **Password hashing** với bcrypt
- **CORS** configuration cho mobile app
- **Input validation** với Zod schemas
- **Rate limiting** (có thể thêm)

## 🚀 Deployment

### Backend (NestJS)

- Deploy lên VPS/Cloud server
- Sử dụng PM2 cho process management
- Nginx làm reverse proxy
- SSL certificate cho HTTPS

### Mobile App

- Build APK/IPA với Expo Application Services (EAS)
- Publish lên Google Play Store và App Store

### Database

- PostgreSQL trên cloud (AWS RDS, Google Cloud SQL)
- Redis trên cloud (AWS ElastiCache)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm thông tin.

## 👥 Team

- **Frontend Developer**: React Native, Expo
- **Backend Developer**: NestJS, PostgreSQL
- **UI/UX Designer**: Mobile app design
- **DevOps**: Deployment và infrastructure

## 📞 Liên hệ

- **Email**: contact@sepolia-health.com
- **Website**: https://sepolia-health.com
- **GitHub**: https://github.com/sepolia-health

---

**Sepolia-Health** - Giải pháp quản lý phòng khám thông minh cho tương lai y tế số! 🏥✨
