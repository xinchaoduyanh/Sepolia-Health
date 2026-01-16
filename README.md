# 🏥 Sepolia-Health

**Hệ thống quản lý phòng khám toàn diện** với Mobile App, Web Portals, và Backend API, được xây dựng bằng React Native (Expo), Next.js 16, và NestJS.


## 📱 Tổng quan

Sepolia-Health là một **giải pháp quản lý phòng khám hiện đại**, cung cấp:

- 📱 **Mobile App** cho bệnh nhân (iOS & Android)
- 💻 **3 Web Portals** cho Admin, Doctor, và Receptionist
- 🔧 **Backend API** với NestJS + PostgreSQL + Redis
- 💬 **Real-time Chat** với Stream Chat
- 📹 **Video Call** với Stream Video SDK
- 🤖 **AI Chatbot** hỗ trợ tự động

## ✨ Tính năng đầy đủ

### � Mobile App (Bệnh nhân)

#### 🔐 Authentication & Profile

- ✅ Đăng ký/Đăng nhập với xác thực email OTP
- ✅ Quản lý nhiều hồ sơ bệnh nhân (gia đình)
- ✅ Cập nhật thông tin cá nhân, avatar
- ✅ Quản lý thông tin sức khỏe (chiều cao, cân nặng, nhóm máu, tiền sử bệnh)
- ✅ Đổi mật khẩu, quên mật khẩu

#### 📅 Appointment Management

- ✅ Đặt lịch khám **offline** (tại phòng khám)
  - Chọn cơ sở y tế
  - Chọn dịch vụ khám
  - Chọn bác sĩ
  - Chọn ngày giờ khám
- ✅ Đặt lịch khám **online** (video call)
  - Tìm bác sĩ theo chuyên khoa
  - Xem lịch trống của bác sĩ
  - Đặt lịch video call
- ✅ Xem lịch sử khám bệnh
- ✅ Xem chi tiết lịch hẹn
- ✅ Hủy lịch hẹn
- ✅ Đánh giá bác sĩ sau khám

#### 💳 Payment

- ✅ Thanh toán qua QR Code (VNPay, MoMo)
- ✅ Áp dụng voucher giảm giá
- ✅ Xem lịch sử giao dịch
- ✅ Tải hóa đơn PDF

#### 💬 Communication

- ✅ Chat real-time với bác sĩ/lễ tân
- ✅ Video call với bác sĩ
- ✅ AI Chatbot hỗ trợ:
  - Tìm bác sĩ theo triệu chứng
  - Tìm dịch vụ khám
  - Đặt lịch tự động
  - Trả lời câu hỏi y tế
- ✅ Nhận thông báo push

#### 📄 Medical Records

- ✅ Xem kết quả khám bệnh
- ✅ Tải file kết quả (PDF, images)
- ✅ Xem đơn thuốc
- ✅ Lịch sử khám bệnh

#### 🎫 QR Code

- ✅ Quét QR để check-in tại phòng khám
- ✅ Quét QR để thanh toán
- ✅ Hiển thị QR code cá nhân

#### 📰 Content

- ✅ Xem bài viết y tế
- ✅ Xem tin tức sức khỏe
- ✅ Xem chương trình khuyến mãi
- ✅ FAQ - Câu hỏi thường gặp

---

### 💻 Web Portal - Admin

#### 📊 Dashboard & Statistics

- ✅ Tổng quan hệ thống (bệnh nhân, lịch hẹn, doanh thu)
- ✅ Biểu đồ thống kê theo thời gian
- ✅ Thống kê theo cơ sở y tế
- ✅ Báo cáo doanh thu chi tiết

#### 👥 User Management

- ✅ Quản lý bệnh nhân (CRUD)
- ✅ Quản lý bác sĩ (CRUD)
- ✅ Quản lý lễ tân (CRUD)
- ✅ Phân quyền người dùng
- ✅ Kích hoạt/Vô hiệu hóa tài khoản

#### 🏥 Clinic Management

- ✅ Quản lý cơ sở y tế (CRUD)
- ✅ Quản lý dịch vụ khám (CRUD)
- ✅ Quản lý chuyên khoa
- ✅ Cấu hình giá dịch vụ

#### 📅 Appointment Management

- ✅ Xem tất cả lịch hẹn
- ✅ Lọc theo trạng thái, ngày, bác sĩ
- ✅ Cập nhật trạng thái lịch hẹn
- ✅ Hủy lịch hẹn

#### 💰 Payment & Promotion

- ✅ Quản lý giao dịch
- ✅ Quản lý voucher/khuyến mãi
- ✅ Cấu hình QR payment
- ✅ Báo cáo doanh thu

#### � Content Management

- ✅ Quản lý bài viết (CRUD)
- ✅ Quản lý tags
- ✅ Quản lý FAQ
- ✅ Quản lý chính sách, điều khoản

#### 💬 Communication

- ✅ Chat với bệnh nhân/bác sĩ
- ✅ Xem lịch sử chat
- ✅ Gửi thông báo hệ thống

---

### 👨‍⚕️ Web Portal - Doctor

#### 📅 Schedule Management

- ✅ Xem lịch làm việc cá nhân
- ✅ Đăng ký ca làm việc
- ✅ Xem danh sách bệnh nhân hôm nay
- ✅ Xem lịch hẹn sắp tới
- ✅ Calendar view (ngày/tuần/tháng)

#### 👥 Patient Management

- ✅ Xem danh sách bệnh nhân đã khám
- ✅ Xem chi tiết hồ sơ bệnh nhân
- ✅ Xem lịch sử khám của bệnh nhân
- ✅ Tìm kiếm bệnh nhân

#### 📋 Appointment Details

- ✅ Xem chi tiết lịch hẹn
- ✅ Cập nhật kết quả khám
- ✅ Upload file kết quả (PDF, images)
- ✅ Ghi chú bệnh án
- ✅ Kê đơn thuốc

#### 💬 Communication

- ✅ Chat với bệnh nhân
- ✅ Video call với bệnh nhân
- ✅ Xem feedback từ bệnh nhân

#### 📊 Statistics

- ✅ Thống kê số lượng bệnh nhân
- ✅ Thống kê lịch hẹn
- ✅ Xem đánh giá từ bệnh nhân

#### ❓ Q&A Community

- ✅ Trả lời câu hỏi từ bệnh nhân
- ✅ Xem danh sách câu hỏi
- ✅ Tìm kiếm câu hỏi

---

### 🏢 Web Portal - Receptionist

#### 📅 Appointment Management

- ✅ Xem danh sách lịch hẹn hôm nay
- ✅ Check-in bệnh nhân
- ✅ Xác nhận lịch hẹn
- ✅ Hủy/Hoãn lịch hẹn
- ✅ Tạo lịch hẹn cho bệnh nhân

#### 👥 Patient Support

- ✅ Tìm kiếm bệnh nhân
- ✅ Xem thông tin bệnh nhân
- ✅ Hỗ trợ đăng ký tài khoản
- ✅ Hỗ trợ đặt lịch

#### 💳 Payment Processing

- ✅ Xử lý thanh toán
- ✅ Quét QR code thanh toán
- ✅ In hóa đơn
- ✅ Xem lịch sử giao dịch

#### 💬 Communication

- ✅ Chat với bệnh nhân
- ✅ Hỗ trợ qua chat
- ✅ Chuyển chat cho bác sĩ

#### 📊 Daily Reports

- ✅ Báo cáo lịch hẹn hôm nay
- ✅ Báo cáo doanh thu
- ✅ Thống kê check-in

## 🛠️ Công nghệ sử dụng

### 📱 Mobile App (Expo 54 + React Native 0.81.5)

**Core Framework:**

- **Expo 54.0.25** - Development platform
- **React Native 0.81.5** - Mobile framework
- **React 19.1.0** - Latest React
- **TypeScript 5.9** - Type safety

**Routing & Navigation:**

- **Expo Router 6.0** - File-based routing
- **React Navigation 7** - Navigation library

**State Management:**

- **TanStack Query v5** - Server state management
- **React Context** - Global state
- **Zustand** - Lightweight state (if needed)

**Styling:**

- **NativeWind 4.1** - Tailwind CSS for React Native
- **Expo Linear Gradient** - Gradient effects

**Real-time & Communication:**

- **Stream Chat Expo 5.45** - Real-time chat
- **Stream Video React Native SDK 1.2** - Video calls
- **Expo AV** - Audio/Video playback

**UI Components:**

- **@gorhom/bottom-sheet** - Bottom sheets
- **react-native-reanimated 4.1** - Smooth animations
- **react-native-gesture-handler** - Touch gestures
- **react-native-svg** - SVG support

**Utilities:**

- **Axios 1.12** - HTTP client
- **date-fns 4.1** - Date manipulation
- **react-hook-form 7.66** - Form handling
- **Expo Camera** - Camera access
- **Expo Image Picker** - Image selection
- **Expo File System** - File operations

---

### 💻 Web App (Next.js 16 + React 19)

**Core Framework:**

- **Next.js 16.0.10** - React framework với App Router
- **React 19.2.3** - Latest React với Server Components
- **TypeScript 5.9** - Type safety

**Monorepo:**

- **Turbo 2.5** - Build system
- **pnpm 10.4** - Package manager
- **Workspace packages** - Shared UI & lib

**State Management:**

- **TanStack Query v5.87** - Server state
- **Zustand 5.0** - Client state
- **React Context** - Global state

**Styling:**

- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Component library
- **next-themes** - Dark mode support

**Real-time & Communication:**

- **Stream Chat React 12.15** - Real-time chat
- **Stream Video React SDK 1.3** - Video calls

**Data Visualization:**

- **Recharts 3.4** - Charts & graphs
- **@tanstack/react-table 8.21** - Data tables

**UI Components:**

- **Radix UI** - Headless components
- **Lucide React** - Icons
- **React Hook Form 7.62** - Forms
- **Zod 3.25** - Schema validation

**Utilities:**

- **Axios 1.12** - HTTP client
- **date-fns 4.1** - Date manipulation
- **jwt-decode 4.0** - JWT parsing
- **react-markdown 10.1** - Markdown rendering

---

### 🔧 Backend API (NestJS + PostgreSQL)

**Core Framework:**

- **NestJS 10** - Node.js framework
- **TypeScript 5.9** - Type safety
- **Node.js 22** - Runtime

**Database:**

- **PostgreSQL 16** - Main database
- **Prisma 6** - ORM
- **Redis 7** - Caching & sessions

**Authentication & Security:**

- **JWT** - Token-based auth
- **bcrypt** - Password hashing
- **Passport.js** - Auth strategies
- **CORS** - Cross-origin requests
- **Helmet** - Security headers

**File Storage:**

- **AWS S3** - Cloud storage
- **Multer** - File upload handling

**Real-time:**

- **Stream Chat** - Chat backend
- **Stream Video** - Video call backend
- **WebSockets** - Real-time events

**AI & Automation:**

- **OpenAI API** - AI Chatbot
- **Langchain** - AI orchestration

**Payment:**

- **VNPay** - Payment gateway
- **QR Code** - Payment QR generation

**API Documentation:**

- **Swagger/OpenAPI** - API docs
- **Zod** - Schema validation

**Email:**

- **Nodemailer** - Email sending
- **AWS SES** - Email service

**Monitoring & Logging:**

- **Winston** - Logging
- **Morgan** - HTTP logging

---

### 🗄️ Database & Infrastructure

**Databases:**

- **PostgreSQL 16** - Main database
  - User management
  - Appointments
  - Medical records
  - Transactions
- **Redis 7** - Caching
  - Session storage
  - OTP codes
  - Rate limiting
  - Payment codes

**Cloud Services:**

- **AWS S3** - File storage (avatars, medical files)
- **AWS SES** - Email delivery
- **Stream** - Chat & Video infrastructure

**Development Tools:**

- **Docker** - Containerization
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📁 Cấu trúc dự án

```
Sepolia-Health/
├── 📱 app/                          # Mobile App (Expo 54 + React Native)
│   ├── app/                         # App screens (Expo Router)
│   │   ├── (homes)/                 # Main app screens
│   │   │   ├── (account)/           # Account management
│   │   │   ├── (appointment)/       # Appointment booking
│   │   │   ├── (chat)/              # Chat screens
│   │   │   ├── (history-appointment)/ # Appointment history
│   │   │   ├── (notification)/      # Notifications
│   │   │   ├── (payment)/           # Payment screens
│   │   │   ├── (profile)/           # Profile management
│   │   │   ├── (qna)/               # Q&A community
│   │   │   └── _layout.tsx          # Tab navigation
│   │   ├── (auth)/                  # Auth screens
│   │   ├── (qr-code)/               # QR scanner
│   │   └── _layout.tsx              # Root layout
│   ├── components/                  # Reusable components
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.tsx          # Authentication
│   │   ├── ChatContext.tsx          # Stream Chat
│   │   ├── VideoContext.tsx         # Stream Video
│   │   └── NotificationContext.tsx  # Notifications
│   ├── lib/                         # Utilities & API client
│   │   ├── api-client.ts            # Axios instance
│   │   └── api/                     # API services
│   ├── types/                       # TypeScript types
│   ├── assets/                      # Images & static files
│   ├── package.json                 # Dependencies
│   └── TECHNICAL_IMPROVEMENTS.md    # Performance improvements plan
│
├── 💻 web/                          # Web App Monorepo (Next.js 16)
│   ├── apps/                        # Main web application
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   │   ├── admin/           # Admin portal routes
│   │   │   │   │   ├── overview/    # Dashboard
│   │   │   │   │   ├── doctor-management/
│   │   │   │   │   ├── customer-management/
│   │   │   │   │   ├── clinic-management/
│   │   │   │   │   ├── service-management/
│   │   │   │   │   ├── article-management/
│   │   │   │   │   └── revenue/     # Revenue reports
│   │   │   │   ├── doctor/          # Doctor portal routes
│   │   │   │   │   ├── schedule/    # Schedule management
│   │   │   │   │   ├── qna/         # Q&A community
│   │   │   │   │   └── notifications/
│   │   │   │   ├── receptionist/    # Receptionist portal routes
│   │   │   │   │   ├── appointment/ # Appointment management
│   │   │   │   │   └── chat/        # Chat support
│   │   │   │   ├── login/           # Login page
│   │   │   │   └── layout.tsx       # Root layout
│   │   │   ├── components/          # React components
│   │   │   ├── contexts/            # React Context
│   │   │   │   ├── ChatContext.tsx
│   │   │   │   └── NotificationContext.tsx
│   │   │   ├── layouts/             # Layout components
│   │   │   ├── shared/              # Shared utilities
│   │   │   │   ├── lib/             # API services
│   │   │   │   ├── hooks/           # Custom hooks
│   │   │   │   └── stores/          # Zustand stores
│   │   │   └── types/               # TypeScript types
│   │   ├── public/                  # Static assets
│   │   ├── next.config.mjs          # Next.js config
│   │   └── package.json             # Dependencies
│   ├── packages/                    # Shared packages
│   │   ├── ui/                      # Shared UI components
│   │   │   ├── components/          # shadcn/ui components
│   │   │   └── globals.css          # Global styles
│   │   ├── lib/                     # Shared utilities
│   │   ├── eslint-config/           # Shared ESLint config
│   │   └── typescript-config/       # Shared TS config
│   ├── turbo.json                   # Turbo config
│   ├── pnpm-workspace.yaml          # pnpm workspace
│   ├── package.json                 # Root dependencies
│   └── TECHNICAL_IMPROVEMENTS.md    # Performance improvements plan
│
├── 🔧 Be/                           # Backend API (NestJS)
│   ├── src/
│   │   ├── common/                  # Shared modules
│   │   │   ├── config/              # Configuration
│   │   │   ├── constants/           # Constants & error messages
│   │   │   ├── decorators/          # Custom decorators
│   │   │   ├── exceptions/          # Exception filters
│   │   │   ├── guards/              # Auth & role guards
│   │   │   ├── interceptors/        # Response interceptors
│   │   │   └── modules/             # Shared modules (Redis, Mail, AWS)
│   │   ├── module/                  # Feature modules
│   │   │   ├── auth/                # Authentication
│   │   │   ├── patient/             # Patient management
│   │   │   │   ├── appointment/     # Appointments
│   │   │   │   ├── profile/         # Patient profiles
│   │   │   │   └── feedback/        # Feedback
│   │   │   ├── doctor/              # Doctor management
│   │   │   │   ├── schedule/        # Doctor schedules
│   │   │   │   └── service/         # Doctor services
│   │   │   ├── admin/               # Admin features
│   │   │   │   ├── statistics/      # Statistics & reports
│   │   │   │   └── management/      # User management
│   │   │   ├── receptionist/        # Receptionist features
│   │   │   ├── payment/             # Payment processing
│   │   │   ├── chatbot/             # AI Chatbot
│   │   │   ├── chat/                # Stream Chat integration
│   │   │   ├── video/               # Stream Video integration
│   │   │   ├── notification/        # Notifications
│   │   │   ├── article/             # Articles & content
│   │   │   └── qna/                 # Q&A community
│   │   └── main.ts                  # Application entry point
│   ├── prisma/                      # Database
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/              # DB migrations
│   │   └── seed-coverage.ts         # Seed data
│   ├── .env.example                 # Environment variables template
│   └── package.json                 # Dependencies
│
├── 📄 Documentation
│   ├── README.md                    # This file
│   ├── app/TECHNICAL_IMPROVEMENTS.md    # Mobile improvements
│   └── web/TECHNICAL_IMPROVEMENTS.md    # Web improvements
│
└── 🔧 Configuration
    ├── .gitignore                   # Git ignore rules
    └── .env.example                 # Environment template
```

### 📊 Metrics

- **Total Lines of Code:** ~110,000+
  - Mobile App: ~76,000 lines
  - Web App: ~34,000 lines
  - Backend: TBD
- **Total Features:** 100+
- **Total API Endpoints:** 80+
- **Total Screens:** 50+

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js 20
- npm hoặc pnpm
- PostgreSQL database
- Redis server
- Expo CLI (cho mobile app) khuyến khích v54

### 1. Clone repository

```bash
git clone https://github.com/xinchaoduyanh/Sepolia-Health.git
cd Sepolia-Health
```

### 2. Cài đặt Backend

```bash
cd Be
npm install
# hoặc
pnpm install
```

### 3. Cấu hình môi trường

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
# ?
```

### 5. Chạy Backend API

```bash
cd Be
npm run start:dev
# API sẽ chạy tại http://localhost:8000
# Swagger docs tại http://localhost:8000/api/docs
```

### 6. Cài đặt Mobile App

```bash
cd app
npm install
```

### 7. Cấu hình Mobile App

```bash
# Chỉnh sửa API_BASE_URL trong constants/api.ts theo ipconfig của be
API_BASE_URL="http://localhost:8000/api"
# Hoặc có thể thêm vào .env của app
cp .env.example .env
API_URL=http://localhost:8000/api
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

## 🔐 Bảo mật

- **JWT Authentication** cho API access
- **Email verification** cho tài khoản mới
- **Password hashing** với bcrypt
- **CORS** configuration cho mobile app
- **Input validation** với Zod schemas
- **Rate limiting** (có thể thêm)

## 🚀 Deployment

### Backend+ Frontend (NestJS + NextJS)

- Deploy lên VPS/Cloud server
- Sử dụng PM2 cho process management
- Nginx làm reverse proxy
- SSL certificate cho HTTPS
- Sử dụng lệnh *npm run pm2:deploy* để deploy nhanh chóng sau khi đẩy code lên vps và cung cấp đúng env 
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

- **Email**: duyanh19122k3@gmail.com
- **Website**: https://vuduyanh.id.vn ( hẹo vì hết tiền rùi)
- **GitHub**: https://github.com/xinchaoduyanh/Sepolia-Health

---
## Lời kết
Đồ án tốt nghiệp của 1 nhóm nào đó tại PTIT khóa D21 thực hiện vào cuối năm 2025 tồn tại khá nhiều lỗ hổng về technical chưa hoàn chỉnh ví dụ như cách handle Streamchat token chưa ok lắm, tiếp theo là RAG build vs Streamchat cx đang khá bất ổn và chưa hoàn thiện btw 1 con 8.6 điểm đồ án là con số tạm ổn

**Sepolia-Health** - Giải pháp quản lý phòng khám thông minh cho tương lai y tế số! 🏥✨
