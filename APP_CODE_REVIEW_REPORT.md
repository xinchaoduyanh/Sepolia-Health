# Báo cáo rà soát Expo Mobile App

**Dự án:** Sepolia Health  
**Phạm vi:** Toàn bộ thư mục `app/`  
**Ngày rà soát:** 16/07/2026  
**Kết luận:** Request Changes

## 1. Tổng quan

- Đã rà soát 182 file được Git quản lý, tương ứng khoảng 32.891 dòng TypeScript/JavaScript.
- Kiến trúc hiện tại: Expo Router → screen → API hooks → API client.
- React Query được dùng cho server state; React Context được dùng cho auth, chat, video, notification, appointment và payment.
- TypeScript strict kiểm tra thành công, không có lỗi type.
- Git sạch tại thời điểm rà soát, không có thay đổi chưa commit.
- Chưa có test tự động cho mobile app.
- `npm audit --omit=dev` phát hiện 38 lỗ hổng dependency: 1 critical, 15 high, 21 moderate và 1 low.
- Mức rủi ro tổng thể: **High**.

## 2. Danh sách vấn đề

### R-001 — Token và dữ liệu người dùng được lưu trong AsyncStorage

- **Mức độ:** S1 — High
- **Phân loại:** Security
- **Vị trí:** `app/lib/api-client.ts`, `app/contexts/AuthContext.tsx`
- **Vấn đề:** Access token, refresh token và toàn bộ `user_data` được lưu trong AsyncStorage.
- **Ảnh hưởng:** AsyncStorage không phải kho lưu trữ bí mật. Trên thiết bị bị root/jailbreak, qua backup hoặc trên thiết bị dùng chung, token và thông tin hồ sơ bệnh nhân có thể bị lấy.
- **Đề xuất:**
  - Chuyển access token và refresh token sang `expo-secure-store`.
  - Chỉ cache phần user data tối thiểu.
  - Dữ liệu sức khỏe nhạy cảm nên được lấy lại từ API hoặc lưu bằng cơ chế mã hóa phù hợp.
- **Độ tin cậy:** High

### R-002 — Retry tất cả mutation có thể lặp thao tác ghi

- **Mức độ:** S1 — High
- **Phân loại:** Reliability
- **Vị trí:** `app/providers/QueryProvider.tsx`, `app/lib/api/appointments.ts`, `app/lib/api/payment.ts`
- **Vấn đề:** Tất cả mutation được cấu hình retry một lần, bao gồm đặt/hủy lịch, tạo QR thanh toán, nhận voucher và cập nhật dữ liệu.
- **Ảnh hưởng:** Nếu server đã xử lý thành công nhưng response bị mất, app có thể gửi lại request và tạo lịch, QR hoặc thao tác ghi hai lần.
- **Đề xuất:**
  - Đặt `mutations.retry: 0` ở cấu hình mặc định.
  - Chỉ retry riêng những mutation an toàn hoặc có idempotency key.
  - Backend nên hỗ trợ idempotency cho đặt lịch và thanh toán.
- **Độ tin cậy:** High

### R-003 — API fallback sử dụng HTTP nội bộ

- **Mức độ:** S1 — High
- **Phân loại:** Security
- **Vị trí:** `app/constants/api.ts`
- **Vấn đề:** Khi thiếu `EXPO_PUBLIC_API_URL`, ứng dụng tự động dùng `http://10.2.50.196:8000/api`.
- **Ảnh hưởng:** Build cấu hình sai có thể gửi token, hồ sơ bệnh nhân và dữ liệu thanh toán qua kết nối không mã hóa hoặc trỏ production app sang nhầm môi trường.
- **Đề xuất:**
  - Không cung cấp HTTP fallback trong production.
  - Validate biến môi trường tại thời điểm build hoặc khi khởi động.
  - Bắt buộc HTTPS ngoài development.
- **Độ tin cậy:** High

### R-004 — Dependency có nhiều lỗ hổng bảo mật

- **Mức độ:** S1 — High
- **Phân loại:** Security
- **Vị trí:** `app/package.json`, `app/package-lock.json`
- **Vấn đề:** `npm audit --omit=dev` báo 38 lỗ hổng, gồm 1 critical và 15 high. Các package đáng chú ý gồm `axios`, `lodash`, `form-data`, `xmldom`, `shell-quote`, `ws`, `undici` và dependency của Stream/Expo.
- **Ảnh hưởng:** Một số lỗi liên quan tới prototype pollution, request/header injection, credential leakage và denial of service.
- **Đề xuất:**
  - Tạo branch riêng để nâng dependency.
  - Chạy `npm audit fix` trước và kiểm tra diff lockfile.
  - Không chạy `npm audit fix --force` trực tiếp trên nhánh chính.
  - Smoke test Android, iOS và web sau khi nâng cấp.
  - Đánh giá thay thế hoặc giới hạn/sanitize nội dung cho `react-native-markdown-display`, do chuỗi dependency hiện có lỗi chưa có bản sửa trực tiếp.
- **Độ tin cậy:** High

### R-005 — Số tiền thanh toán được quyết định từ frontend

- **Mức độ:** S2 — Medium
- **Phân loại:** Security
- **Vị trí:** `app/app/(homes)/(payment)/voucher-select.tsx`, `app/app/(homes)/(payment)/qr-payment.tsx`
- **Vấn đề:** `finalAmount` được tính ở frontend, truyền qua route params rồi gửi lại API tạo QR dưới trường `amount`.
- **Ảnh hưởng:** Route params có thể bị chỉnh qua deep link hoặc runtime instrumentation. Nếu backend tin giá trị này, người dùng có thể thay đổi số tiền thanh toán.
- **Đề xuất:**
  - Backend phải tự tính số tiền từ `appointmentId` và `userPromotionId`.
  - Frontend không nên gửi hoặc quyết định số tiền cuối cùng.
  - App chỉ hiển thị số tiền backend trả về.
- **Độ tin cậy:** Medium — cần đối chiếu backend để xác nhận server đã kiểm tra lại hay chưa.

### R-006 — Race condition khi khởi tạo và refresh token

- **Mức độ:** S2 — Medium
- **Phân loại:** Reliability
- **Vị trí:** `app/lib/api-client.ts`
- **Vấn đề:** Constructor gọi `loadToken()` nhưng không chờ hoàn tất; nhiều response 401 cũng có thể đồng thời gọi refresh token.
- **Ảnh hưởng:** Request đầu tiên sau khi mở app có thể chạy trước khi token được nạp. Nhiều request 401 đồng thời có thể refresh song song, ghi đè refresh token mới hoặc làm logout ngoài ý muốn.
- **Đề xuất:**
  - Tạo `tokenReadyPromise` và bắt request interceptor chờ promise này.
  - Dùng một shared/single-flight refresh promise để mọi request 401 chờ cùng một lần refresh.
- **Độ tin cậy:** High

### R-007 — Screen và Context quá lớn

- **Mức độ:** S2 — Medium
- **Phân loại:** Maintainability
- **Vị trí tiêu biểu:**
  - `app/app/(homes)/(appointment)/index.tsx`: khoảng 1.479 dòng.
  - `app/app/(homes)/index.tsx`: khoảng 1.393 dòng.
  - `app/app/(homes)/(appointment)/create.tsx`: khoảng 1.003 dòng.
  - `app/app/(homes)/(appointment)/create-online.tsx`: khoảng 959 dòng.
  - `app/contexts/ChatContext.tsx`: khoảng 587 dòng.
  - `app/contexts/VideoContext.tsx`: khoảng 490 dòng.
- **Vấn đề:** UI, gọi API, biến đổi dữ liệu và điều phối state bị trộn trong cùng file.
- **Ảnh hưởng:** Thay đổi nhỏ dễ tạo regression, khó review và khó viết test độc lập.
- **Đề xuất:**
  - Tổ chức theo feature, ví dụ `features/appointments/{api,hooks,components,screens,types}`.
  - Tách screen thành container, section component và custom hook.
  - Context chỉ nên giữ state thực sự dùng toàn cục.
- **Độ tin cậy:** High

### R-008 — Không có test tự động cho mobile app

- **Mức độ:** S2 — Medium
- **Phân loại:** Testing
- **Vị trí:** `app/package.json` và toàn bộ `app/`
- **Vấn đề:** Không có file test và không có script `test`.
- **Ảnh hưởng:** Các flow đăng nhập/refresh token, đặt lịch, voucher, polling thanh toán và QR scanner không có hàng rào chống regression.
- **Đề xuất:**
  - Bắt đầu bằng unit test cho validation, API client và các phép tính payment.
  - Thêm integration test cho auth và appointment flow.
  - Ưu tiên test race condition và retry trước snapshot UI.
- **Độ tin cậy:** High

### R-009 — Log production có thể chứa dữ liệu nhạy cảm

- **Mức độ:** S2 — Medium
- **Phân loại:** Security
- **Vị trí tiêu biểu:** `app/contexts/NotificationContext.tsx`, `app/contexts/ChatContext.tsx`, `app/contexts/VideoContext.tsx`, `app/app/(homes)/(appointment-detail)/index.tsx`
- **Vấn đề:** Có khoảng 95 `console.log`, cùng nhiều `console.warn` và `console.error`. Một số log chứa user ID, dữ liệu channel, notification hoặc toàn bộ appointment.
- **Ảnh hưởng:** Log production có thể làm lộ thông tin người dùng và dữ liệu khám bệnh qua thiết bị, remote debugger hoặc hệ thống thu log.
- **Đề xuất:**
  - Tạo logger có sanitize và chỉ bật debug trong `__DEV__`.
  - Production error chỉ gửi error code và context tối thiểu tới Sentry/Crashlytics.
  - Không gửi payload người dùng, token, email, số điện thoại hoặc dữ liệu lịch khám vào log.
- **Độ tin cậy:** High

### R-010 — Chất lượng lint và formatting chưa đạt

- **Mức độ:** S3 — Low
- **Phân loại:** Style
- **Vị trí:** Toàn bộ `app/`
- **Vấn đề:** ESLint báo 60 warning và Prettier báo 48 file chưa đúng format. Các vấn đề gồm missing hook dependencies, unused code, `any`, route cast `as any` và import trùng.
- **Ảnh hưởng:** Chưa phá build nhưng làm giảm lợi ích của strict TypeScript và có thể che race/stale closure trong hook.
- **Đề xuất:**
  - Ưu tiên sửa `react-hooks/exhaustive-deps`.
  - Loại bỏ unused code và giảm `any`.
  - Dùng typed routes thay cho `as any`.
  - Giới hạn lint vào source, loại `.expo`, native/generated và file cấu hình local.
- **Độ tin cậy:** High

## 3. Đánh giá tổ chức code

### Điểm mạnh

- TypeScript đã bật `strict` và `npx tsc --noEmit` chạy thành công.
- API được gom tương đối nhất quán trong `lib/api`, không gọi Axios trực tiếp rải rác ở mọi screen.
- React Query keys và query invalidation đã được sử dụng trong nhiều feature.
- Expo Router route groups phân chia auth, homes, appointment, payment, chat và profile khá dễ hiểu.
- Payment polling có cleanup interval khi unmount.
- QR scanner có chống xử lý trùng trong cùng phiên và gửi chữ ký QR về backend để xác minh.
- `.env`, key, certificate và native build folders đã được ignore.
- Dự án đã có `app/TECHNICAL_IMPROVEMENTS.md`, cho thấy một phần technical debt đã được nhận diện.

### Điểm hạn chế

- Tổ chức hiện tại thiên về loại file (`components`, `contexts`, `lib`, `types`) hơn là feature/domain.
- Business logic nằm nhiều trong screen và Context.
- Provider toàn cục được lồng sâu trong root layout; chat, notification và video đều có lifecycle phức tạp.
- Một số route vẫn phải cast `as any` dù Expo typed routes đã bật.
- Chưa có lớp logging, secure storage, error reporting và test infrastructure thống nhất.

### Điểm đánh giá

**6/10** — cấu trúc nền tảng và naming khá rõ, nhưng feature boundary chưa tốt, screen/context quá lớn và thiếu test. Khi số lượng tính năng tiếp tục tăng, chi phí thay đổi và nguy cơ regression sẽ tăng nhanh.

## 4. Thứ tự xử lý đề xuất

### P0 — Cần xử lý trước production

- [ ] R-001: Chuyển token sang SecureStore.
- [ ] R-002: Tắt global mutation retry và bổ sung idempotency cho thao tác quan trọng.
- [ ] R-003: Loại bỏ HTTP API fallback khỏi production.
- [ ] R-004: Nâng và kiểm thử dependency có lỗ hổng critical/high.

### P1 — Xử lý ngay sau P0

- [ ] R-005: Đảm bảo backend tự tính và xác minh số tiền thanh toán.
- [ ] R-006: Đồng bộ quá trình load/refresh token.
- [ ] R-009: Loại dữ liệu nhạy cảm khỏi production log.
- [ ] R-008: Thêm test cho auth, payment và appointment.

### P2 — Cải thiện khả năng bảo trì

- [ ] R-007: Tách các screen và Context lớn theo feature.
- [ ] R-010: Làm sạch lint, formatting và typed routes.

## 5. Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| `git status --short` | Pass — working tree sạch |
| `npx tsc --noEmit` | Pass — không có lỗi TypeScript |
| `npm run lint` | Fail quality gate — 60 ESLint warning, 48 file lệch Prettier |
| Tìm test trong `app/` | Không có test |
| `npm audit --omit=dev --audit-level=moderate` | 38 vulnerabilities: 1 critical, 15 high, 21 moderate, 1 low |

## 6. Kết luận

**Verdict: Request Changes**

App có nền tảng kiến trúc tương đối ổn và kiểm tra TypeScript tốt, nhưng chưa nên coi là production-safe cho một ứng dụng y tế trước khi xử lý các vấn đề S1. Hướng cải thiện hiệu quả nhất là làm chắc tầng auth/API/payment trước, sau đó bổ sung test và tách dần các màn hình lớn sang cấu trúc theo feature.
