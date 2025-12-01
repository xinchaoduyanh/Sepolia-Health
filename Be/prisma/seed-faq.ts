import { PrismaClient, AppTermsType } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive AppTerms data for the healthcare app
const appTermsData = [
  // APP_FAQ - Hỏi đáp về ứng dụng
  {
    type: AppTermsType.APP_FAQ,
    title: 'Câu hỏi thường gặp',
    content: `# CÂU HỎI THƯỜNG GẶP

## 📱 **SỬ DỤNG ỨNG DỤNG**

### 🔹 Làm thế nào để đặt lịch khám bệnh?
Bạn có thể đặt lịch khám bệnh bằng cách làm theo các bước sau:

1. 📲 **Đăng nhập** vào tài khoản của bạn
2. 🏠 Chọn mục **"Đặt lịch"** trên màn hình chính
3. ⚕️ Chọn **chuyên khoa** cần khám
4. 👨‍⚕️ Chọn **bác sĩ** và **thời gian** phù hợp
5. 📝 Điền thông tin bệnh nhân (nếu cần)
6. ✅ Xác nhận lịch hẹn và thanh toán

> 💡 **Mẹo:** Bạn sẽ nhận được xác nhận lịch hẹn qua email và thông báo trên ứng dụng!

---

### 🔹 Tôi có thể hủy lịch hẹn không?
Có, bạn có thể hủy lịch hẹn trong mục **"Lịch hẹn của tôi"**.

| Thời gian hủy | Chính sách hoàn tiền |
|---------------|-------------------|
| ❗ Trước 24 giờ | 💰 Hoàn tiền 100% |
| ⏰ Trong 24 giờ | ❌ Không hoàn tiền |
| 🆘 Trường hợp khẩn cấp | 🔍 Xem xét riêng |

> 📞 **Liên hệ:** Vui lòng gọi tổng đài nếu cần hỗ trợ gấp!

---

### 🔹 Làm thế nào để thêm hồ sơ bệnh nhân?
Để thêm hồ sơ bệnh nhân mới:

1. 👤 Vào mục **"Hồ sơ"** từ menu chính
2. ➕ Chọn **"Thêm hồ sơ bệnh nhân"**
3. 📋 Điền đầy đủ thông tin:
   - Tên, tuổi, giới tính, số điện thoại
   - Thông tin y tế quan trọng (dị ứng, bệnh nền)
4. 💾 Lưu hồ sơ

> 👨‍👩‍👧‍👦 **Gia đình:** Bạn có thể thêm hồ sơ cho con cái hoặc người thân để dễ dàng đặt lịch!

---

### 🔹 Tôi có thể xem kết quả khám bệnh ở đâu?
Kết quả khám bệnh sẽ được cập nhật tại:

- 📱 **Mục "Lịch hẹn của tôi"** → Chi tiết lịch hẹn
- 🏥 **Tab "Kết quả khám"** trong hồ sơ bệnh nhân
- 📧 **Email thông báo** khi có kết quả mới

> ⏰ **Thời gian:** Bác sĩ sẽ cập nhật kết quả trong vòng 24 giờ sau khi khám

---

## 💳 **THANH TOÁN & BẢO HIỂM**

### 🔹 Phương thức thanh toán nào được chấp nhận?
Chúng tôi chấp nhận các phương thức thanh toán sau:

- 💳 Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB)
- 📱 Ví điện tử (MoMo, ZaloPay)
- 🏦 Chuyển khoản ngân hàng
- 💵 Tiền mặt (khi khám tại phòng khám)
- 🏥 Bảo hiểm y tế (với các đối tác liên kết)

> 🔒 **Bảo mật:** Tất cả giao dịch đều được mã hóa và bảo mật!

---

### 🔹 Làm thế nào để sử dụng bảo hiểm y tế?
Để sử dụng bảo hiểm y tế:

1. 📄 Thêm thông tin bảo hiểm trong hồ sơ bệnh nhân
2. 🏥 Chọn **"Thanh toán bằng bảo hiểm"** khi đặt lịch
3. 🆔 Cần mang theo thẻ bảo hiểm và giấy tờ tùy thân khi đến khám
4. 💰 Phần trăm chi trả sẽ được áp dụng theo quy định

> 🏥 **Kiểm tra:** Vui lòng kiểm tra danh sách bệnh viện liên kết trên ứng dụng!

---

## 🔧 **HỖ TRỢ KỸ THUẬT**

### 🔹 Quên mật khẩu phải làm gì?
Để lấy lại mật khẩu:

1. 🔓 Chọn **"Quên mật khẩu"** trên màn hình đăng nhập
2. 📧 Nhập email hoặc số điện thoại đã đăng ký
3. 🔗 Nhấn vào link xác nhận nhận được qua email/SMS
4. 🔄 Đặt mật khẩu mới
5. ✅ Đăng nhập với mật khẩu mới

> 📮 **Lưu ý:** Nếu không nhận được email, vui lòng kiểm tra hộp thư spam!

---

### 🔹 Tại sao ứng dụng báo lỗi kết nối?
**Nguyên nhân và cách khắc phục:**

1. 🌐 Kiểm tra kết nối internet (WiFi/4G)
2. 🔄 Tắt và mở lại ứng dụng
3. ⬆️ Cập nhật phiên bản mới nhất
4. 🗑️ Xóa cache ứng dụng
5. 🔍 Kiểm tra hệ thống bảo trì trên fanpage

> 📸 **Hỗ trợ:** Nếu vấn đề kéo dài, chụp màn hình và gửi về support!

---

## 🏥 **DỊCH VỤ Y TẾ**

### 🔹 Lịch khám online hoạt động như thế nào?
**Lịch khám online (telemedicine):**

- 📹 Được thực hiện qua video call
- 👨‍⚕️ Bác sĩ tư vấn và kê đơn điện tử
- 💻 Phù hợp với các bệnh không cần khám trực tiếp
- ⚠️ Lưu ý: Các trường hợp khẩn cấp cần đến bệnh viện

**Chuẩn bị:** Kết nối internet ổn định, camera, microphone

---

## 🆘 **TÌNH HUỐNG KHẨN CẤP**

### 🔹 Trường hợp khẩn cấp phải làm gì?
**Với các trường hợp khẩn cấp:**

1. 🚑 Gọi ngay **115** hoặc số cấp cứu gần nhất
2. ❌ Không sử dụng ứng dụng cho các trường hợp nguy hiểm đến tính mạng
3. ⚠️ Các dấu hiệu khẩn cấp:
   - Khó thở
   - Đau ngực dữ dội
   - Chảy máu không ngừng

4. 🏥 Sau khi ổn định, có thể đặt lịch tái khám trên ứng dụng

---

## 📞 **LIÊN HỆ HỖ TRỢ**

**Các kênh hỗ trợ:**
- ☎️ **Hotline:** 1900-xxxx (24/7)
- 📧 **Email:** support@sepolia-health.vn
- 💬 **Chat:** Trực tiếp trên ứng dụng
- 📘 **Fanpage:** Facebook @SepoliaHealth
- ⏰ **Thời gian phản hồi:** 2-4 giờ làm việc

---

*Cập nhật lần cuối: ${new Date().toLocaleDateString('vi-VN')}*`,
  },

  // USAGE_REGULATIONS - Quy định sử dụng
  {
    type: AppTermsType.USAGE_REGULATIONS,
    title: 'Quy định sử dụng ứng dụng Sepolia Health',
    content: `# QUY ĐỊNH SỬ DỤNG ỨNG DỤNG SEPOLIA HEALTH

## 📋 **GIỚI THIỆU**
Chào mừng bạn đến với ứng dụng Sepolia Health! Trước khi sử dụng dịch vụ của chúng tôi, vui lòng đọc kỹ các quy định dưới đây.

---

## 🎯 **ĐIỀU KIỆN SỬ DỤNG**

### 1️⃣ **Điều kiện chung**
- 🔞 **Tuổi tối thiểu:** 18 tuổi để đăng ký tài khoản
- 🆔 **Thông tin cá nhân:** Cung cấp thông tin chính xác
- 📱 **Thiết bị:** Smartphone hoặc tablet có kết nối internet
- 💊 **Đối tượng:** Công dân Việt Nam hoặc người nước ngoài đang sinh sống tại Việt Nam

### 2️⃣ **Trách nhiệm người dùng**
- ✅ **Xác thực thông tin:** Đảm bảo thông tin cá nhân chính xác
- 🔒 **Bảo mật tài khoản:** Chịu trách nhiệm về tài khoản của mình
- 💊 **Sức khỏe:** Cung cấp thông tin sức khỏe trung thực
- 📅 **Đúng giờ:** Đến khám đúng giờ hẹn đã đăng ký

---

## 🏥 **QUY ĐỊNH VỀ DỊCH VỤ Y TẾ**

### 📅 **Đặt lịch hẹn**
- ⏰ **Thời gian:** Đặt lịch trước ít nhất 2 giờ
- 🔄 **Hủy lịch:** Hủy trước 24 giờ để được hoàn tiền
- 👥 **Số lượng:** Mỗi tài khoản đặt tối đa 3 lịch hẹn/tuần
- 💰 **Thanh toán:** Thanh toán trước khi xác nhận lịch hẹn

### 👨‍⚕️ **Tư vấn y tế**
- 💬 **Tư vấn online:** Chỉ适用于 các bệnh thông thường
- 🏥 **Khám trực tiếp:** Cần đến bệnh viện cho các trường hợp nghiêm trọng
- 📋 **Đơn thuốc:** Bác sĩ có quyền không kê đơn nếu không cần thiết
- ⚠️ **Trường hợp khẩn cấp:** Không sử dụng ứng dụng, gọi ngay 115

---

## 💳 **QUY ĐỊNH THANH TOÁN**

### 💰 **Phương thức thanh toán**
- 💳 **Thẻ ngân hàng:** Visa, Mastercard, JCB
- 📱 **Ví điện tử:** MoMo, ZaloPay
- 🏦 **Chuyển khoản:** Internet banking
- 💵 **Tiền mặt:** Tại quầy phòng khám

### 🔄 **Chính sách hoàn tiền**
| Tình huống | Chính sách hoàn tiền |
|------------|-------------------|
| Hủy lịch trước 24 giờ | 💯 100% |
| Hủy lịch trong 24 giờ | ❌ 0% |
| Bệnh viện hủy lịch | 💯 100% |
| Trường hợp bất khả kháng | 🔍 Xem xét theo từng trường hợp |

> ⏰ **Thời gian hoàn tiền:** 3-5 ngày làm việc

---

## 🔒 **BẢO MẬT VÀ RIÊNG TƯ**

### 🛡️ **Cam kết bảo mật**
- 🔐 **Mã hóa dữ liệu:** Theo tiêu chuẩn quốc tế AES-256
- 🚫 **Không chia sẻ:** Không bán thông tin cho bên thứ ba
- 👨‍⚕️ **Truy cập có giới hạn:** Chỉ bác sĩ điều trị được xem hồ sơ
- 📱 **Bảo mật ứng dụng:** Two-factor authentication (2FA)

### 👤 **Quyền lợi người dùng**
- 📋 **Quyền được biết:** Biết cách thông tin của bạn được sử dụng
- ✏️ **Quyền sửa đổi:** Cập nhật thông tin cá nhân
- ❌ **Quyền xóa:** Yêu cầu xóa tài khoản và dữ liệu
- 📤 **Quyền xuất:** Xuất dữ liệu sức khỏe của bạn

---

## ❌ **NHỮNG HÀNH VI BỊ CẤM**

### 🚫 **Không được làm gì?**
- 🎭 **Mạo danh:** Tạo tài khoản giả mạo người khác
- 💊 **Tự kê đơn:** Yêu cầu bác sĩ kê đơn không cần thiết
- 😠 **Quấy rối:** Làm phiền bác sĩ hoặc nhân viên y tế
- 💣 **Tấn công:** Cố ý phá hoại hệ thống ứng dụng
- 💰 **Lừa đảo:** Sử dụng ứng dụng cho mục đích bất chính

### ⚖️ **Hậu quả vi phạm**
- 🚫 **Khóa tài khoản:** Tạm thời hoặc vĩnh viễn
- ⚖️ **Truy cứu trách nhiệm pháp lý:** Theo quy định pháp luật Việt Nam
- 📞 **Báo cáo cơ quan chức năng:** Với các hành vi nghiêm trọng

---

## 🔄 **CẬP NHẬT VÀ THAY ĐỔI**

### 📝 **Cập nhật quy định**
- 📅 **Thời gian:** Chúng tôi có thể cập nhật quy định định kỳ
- 📧 **Thông báo:** Người dùng sẽ nhận được thông báo qua email/app
- ⏰ **Hiệu lực:** Quy định mới có hiệu lực sau 7 ngày thông báo

### 🤝 **Phản hồi**
- 📧 **Góp ý:** support@sepolia-health.vn
- ⭐ **Đánh giá:** Đánh giá ứng dụng trên App Store/Google Play
- 💬 **Hỗ trợ:** Chat trực tiếp trong ứng dụng

---

## 📞 **THÔNG TIN LIÊN HỆ**

**Công ty TNHH Sepolia Health**
- 🏢 **Địa chỉ:** 123 Nguyễn Huệ, Quận 1, TP.HCM
- ☎️ **Hotline:** 1900-xxxx
- 📧 **Email:** info@sepolia-health.vn
- 🌐 **Website:** www.sepolia-health.vn

---

*Phiên bản: 1.0 | Cập nhật lần cuối: ${new Date().toLocaleDateString('vi-VN')}*`,
  },

  // DISPUTE_RESOLUTION - Chính sách giải quyết khiếu nại, tranh chấp
  {
    type: AppTermsType.DISPUTE_RESOLUTION,
    title: 'Chính sách giải quyết khiếu nại và tranh chấp',
    content: `# CHÍNH SÁCH GIẢI QUYẾT KHIẾU NẠI VÀ TRANH CHẤP

## 📋 **MỤC TIÊU CHÍNH SÁCH**
Chính sách này nhằm xây dựng quy trình giải quyết khiếu nại một cách **công bằng**, **minh bạch** và **hiệu quả** giữa Sepolia Health và người dùng.

---

## 🔄 **QUY TRÌNH GIẢI QUYẾT KHIẾU NẠI**

### 🎯 **Bước 1: Gửi khiếu nại**
**Các kênh tiếp nhận:**
- 📧 **Email:** complaints@sepolia-health.vn
- ☎️ **Hotline:** 1900-xxxx (nhánh 2)
- 💬 **Chat trực tiếp:** Trong ứng dụng
- 📝 **Biểu mẫu:** Tại quầy phòng khám

**Thông tin cần cung cấp:**
- 👤 **Họ và tên**, số điện thoại, email
- 🆔 **Mã tài khoản** (nếu có)
- 📋 **Nội dung khiếu nại** (chi tiết)
- 📎 **Bằng chứng** (hình ảnh, tài liệu liên quan)

### 🕐 **Thời gian phản hồi:**
| Loại khiếu nại | Thời gian phản hồi |
|----------------|-------------------|
| 📝 Khiếu nại chung | 24 giờ làm việc |
| 💰 Vấn đề thanh toán | 12 giờ làm việc |
- 🏥 Vấn đề y tế | 48 giờ làm việc |
| 🔐 Vấn đề bảo mật | 8 giờ làm việc |

---

### 🎯 **Bước 2: Xử lý khiếu nại**
**Quy trình nội bộ:**
1. 📋 **Ghi nhận:** Tạo mã số khiếu nại
2. 🔍 **Phân loại:** Xác định mức độ ưu tiên
3. 👨‍💼 **Phân công:** Chuyển cho bộ phận liên quan
4. 🔎 **Điều tra:** Thu thập thông tin, bằng chứng
5. ✅ **Phân tích:** Đánh giá và đưa ra phương án

### 📊 **Mức độ ưu tiên xử lý:**
- 🔴 **Cao (Khẩn cấp):** 4-8 giờ
- 🟡 **Trung bình:** 24-48 giờ
- 🟢 **Thấp:** 3-5 ngày làm việc

---

### 🎯 **Bước 3: Phản hồi giải pháp**
**Phương thức phản hồi:**
- 📧 **Email chính thức**
- ☎️ **Gọi điện trực tiếp**
- 💬 **Tin nhắn trong ứng dụng**
- 📄 **Văn bản (nếu cần)**

**Nội dung phản hồi bao gồm:**
- 📋 **Tóm tắt vấn đề**
- 🔍 **Kết quả điều tra**
- ✅ **Phương án giải quyết**
- ⏰ **Thời gian thực hiện**
- 📞 **Người liên hệ hỗ trợ**

---

## 💰 **CÁC LOẠI KHIẾU NẠI PHỔ BIẾN**

### 1️⃣ **Khiếu nại về dịch vụ y tế**
**Vấn đề:**
- 👨‍⚕️ **Chất lượng khám chữa bệnh**
- 💊 **Tư vấn không đầy đủ**
- ⏰ **Thời gian chờ đợi lâu**
- 📋 **Kết quả không chính xác**

**Giải quyết:**
- 🔍 **Điều tra lại:** Yêu cầu bác sĩ cấp trên xem xét
- 🔄 **Tái khám miễn phí:** Nếu có lỗi từ hệ thống
- 💰 **Hoàn tiền:** Theo chính sách hoàn tiền
- 📝 **Xin lỗi chính thức:** Nếu có sai sót

### 2️⃣ **Khiếu nại về thanh toán**
**Vấn đề:**
- 💳 **Trừ sai số tiền**
- 🔄 **Chưa nhận được hoàn tiền**
- 💰 **Phí không minh bạch**
- 📱 **Lỗi giao dịch**

**Giải quyết:**
- 🔍 **Kiểm tra giao dịch:** Xác minh với ngân hàng
- 💰 **Hoàn tiền ngay lập tức:** Nếu có lỗi hệ thống
- 📄 **Giải thích chi tiết:** Về các khoản phí
- 🎁 **Khuyến mãi:** Bồi thường cho trải nghiệm không tốt

### 3️⃣ **Khiếu nại về kỹ thuật**
**Vấn đề:**
- 📱 **Lỗi ứng dụng**
- 🌐 **Không kết nối được**
- 🔐 **Vấn đề tài khoản**
- 📊 **Dữ liệu bị mất**

**Giải quyết:**
- 🛠️ **Sửa lỗi khẩn cấp:** Trong vòng 4-8 giờ
- 🔄 **Khôi phục dữ liệu:** Từ backup hệ thống
- 📱 **Hướng dẫn khắc phục:** Chi tiết qua điện thoại
- 💰 **Đền bù:** Giảm giá cho lần sử dụng tiếp theo

---

## ⚖️ **QUY TRÌNH GIẢI QUYẾT TRANH CHẤP**

### 🎯 **Cấp 1: Thương lượng trực tiếp**
- ⏰ **Thời gian:** 5-7 ngày làm việc
- 👥 **Thành phần:** Đại diện Sepolia Health + Người dùng
- 📝 **Mục tiêu:** Đạt được thỏa thuận chung
- 📋 **Kết quả:** Biên bản thỏa thuận

### 🎯 **Cấp 2: Hòa giải trung gian**
- ⏰ **Thời gian:** 10-15 ngày làm việc
- 👨‍⚖️ **Bên thứ ba:** Trung tâm hòa调解 thương mại Việt Nam
- 📋 **Văn bản:** Yêu cầu hòa giải chính thức
- 💰 **Chi phí:** Sepolia Health chi trả 50%

### 🎯 **Cấp 3: Tòa án**
- ⏰ **Thời gian:** Theo quy định pháp luật
- 🏛️ **Thẩm quyền:** Tòa án nhân dân có thẩm quyền
- 📋 **Hồ sơ:** Toàn bộ tài liệu, bằng chứng
- ⚖️ **Quyết định:** Mang tính ràng buộc pháp lý

---

## 📋 **QUY ĐỊNH CỤ THỂ**

### 🕐 **Thời hiệu khiếu nại**
- 💰 **Tài chính:** 90 ngày từ thời điểm phát sinh
- 🏥 **Y tế:** 1 năm từ thời điểm khám chữa bệnh
- 🔐 **Bảo mật:** Không giới hạn thời gian
- 📱 **Kỹ thuật:** 30 ngày từ thời điểm phát sinh

### 📄 **Bằng chứng khiếu nại**
**Bằng chứng chấp nhận:**
- 📸 **Hình ảnh, video**
- 📄 **Hóa đơn, chứng từ**
- 📧 **Email, tin nhắn**
- 📋 **Kết quả xét nghiệm**
- 🎥 **Ghi âm (đã được phép)**

### 🚫 **Khiếu nại không được chấp nhận**
- ❌ **Thiếu thông tin:** Không đủ thông tin xác thực
- ⏰ **Quá thời hiệu:** Vượt quá thời gian quy định
- 📋 **Không thuộc thẩm quyền:** Vấn đề ngoài phạm vi dịch vụ
- 🎭 **Khiếu nại trùng lặp:** Đã được giải quyết trước đó

---

## 📞 **THÔNG TIN LIÊN HỆ HỖ TRỢ**

**Bộ phận Giải quyết Khiếu nại**
- ☎️ **Hotline:** 1900-xxxx (nhánh 2)
- 📧 **Email:** complaints@sepolia-health.vn
- 🕒 **Giờ làm việc:** 8:00 - 17:30 (Thứ 2 - Thứ 6)
- 🏢 **Địa chỉ:** 123 Nguyễn Huệ, Q.1, TP.HCM

**Người phụ trách chính:**
- 👨‍💼 **Trưởng phòng:** Trần Văn A
- 📱 **Điện thoại:** 09xx-xxx-xxx
- 📧 **Email:** trana@sepolia-health.vn

---

## 📊 **BÁO CÁO VÀ CẢI TIẾN**

### 📈 **Thống kê định kỳ**
- 📊 **Số lượng khiếu nại:** Theo tháng/quý/năm
- 📋 **Loại khiếu nại:** Phân loại theo vấn đề
- ⏰ **Thời gian giải quyết:** Trung bình từng loại
- 😊 **Tỷ lệ hài lòng:** Khảo sát sau khi giải quyết

### 🔄 **Cải tiến liên tục**
- 📝 **Phân tích nguyên nhân:** Tìm ra gốc rễ vấn đề
- 🛠️ **Cải tiến quy trình:** Tối ưu hóa quy trình hiện tại
- 👥 **Đào tạo nhân viên:** Nâng cao kỹ năng xử lý
- 💡 **Công nghệ mới:** Áp dụng công nghệ hiện đại

---

*Các quy định này có hiệu lực từ ngày ký và được áp dụng cho tất cả người dùng của Sepolia Health.*

*Phiên bản: 1.0 | Cập nhật lần cuối: ${new Date().toLocaleDateString('vi-VN')}*`,
  },

  // PRIVACY_POLICY - Chính sách bảo vệ dữ liệu cá nhân
  {
    type: AppTermsType.PRIVACY_POLICY,
    title: 'Chính sách bảo vệ dữ liệu cá nhân',
    content: `# CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN

## 🔒 **CAM KẾT BẢO MẬT**
Sepolia Health cam kết bảo vệ dữ liệu cá nhân của bạn tuân thủ **Luật An ninh mạng 2018** và **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân tại Việt Nam.

---

## 📋 **THÔNG TIN THU THẬP**

### 👤 **Thông tin cá nhân cơ bản**
Chúng tôi thu thập các thông tin sau:
- 📝 **Họ và tên đầy đủ**
- 📅 **Ngày sinh**
- 🆔 **Số CCCD/CMND**
- 📧 **Email**
- 📱 **Số điện thoại**
- 🏠 **Địa chỉ thường trú**
- 👥 **Thông tin người thân (nếu có)**

### 🏥 **Thông tin sức khỏe**
- 📋 **Hồ sơ bệnh án**
- 💊 **Lịch sử khám chữa bệnh**
- 🩺 **Kết quả xét nghiệm**
- 💉 **Tiêm chủng**
- 🤧 **Dị ứng**
- 💊 **Thuốc đang sử dụng**
- 🧬 **Bệnh nền**

### 📱 **Thông tin kỹ thuật**
- 🌐 **Địa chỉ IP**
- 📱 **Thông tin thiết bị**
- 🔍 **Lịch sử tìm kiếm**
- 📍 **Vị trí (khi được phép)**
- 🍪 **Cookie dữ liệu**

---

## 🎯 **MỤC ĐÍCH SỬ DỤNG DỮ LIỆU**

### 🏥 **Cung cấp dịch vụ y tế**
- 👨‍⚕️ **Đặt lịch khám:** Sắp xếp lịch hẹn phù hợp
- 📋 **Chuẩn bị thông tin:** Giúp bác sĩ nắm tình trạng
- 💊 **Kê đơn thuốc:** Đảm bảo an toàn khi sử dụng
- 📞 **Tư vấn y tế:** Cung cấp tư vấn chính xác
- 📊 **Theo dõi sức khỏe:** Quản lý tình trạng lâu dài

### 💰 **Quản lý thanh toán**
- 💳 **Xử lý giao dịch:** Thanh toán dịch vụ y tế
- 📄 **Xuất hóa đơn:** Cung cấp chứng từ hợp lệ
- 🔄 **Hoàn tiền:** Xử lý yêu cầu hoàn tiền
- 💰 **Bảo hiểm:** Kết nối với công ty bảo hiểm

### 📱 **Cải thiện trải nghiệm**
- 🔍 **Cá nhân hóa:** Gợi ý dịch vụ phù hợp
- 📊 **Phân tích:** Nghiên cứu hành vi người dùng
- 🛠️ **Cải tiến:** Nâng cao chất lượng dịch vụ
- 📧 **Thông báo:** Cập nhật thông tin quan trọng

---

## 🔐 **CÁCH CHÚNG TÔI BẢO VỆ DỮ LIỆU**

### 🛡️ **Biện pháp kỹ thuật**
- 🔐 **Mã hóa AES-256:** Mã hóa dữ liệu đầu cuối
- 🌐 **HTTPS/Lets Encrypt:** Bảo mật kết nối
- 🔑 **Two-Factor Authentication:** Xác thực hai yếu tố
- 🛡️ **Firewall:** Chặn truy cập trái phép
- 🔄 **Backup định kỳ:** Sao lưu dữ liệu hàng ngày
- 🚫 **Anti-DDoS:** Chống tấn công từ chối dịch vụ

### 🏢 **Biện pháp tổ chức**
- 👥 **Phân quyền truy cập:** Chỉ nhân viên có thẩm quyền
- 📋 **Hợp đồng bảo mật:** Ký cam kết với nhân viên
- 🎓 **Đào tạo định kỳ:** Huấn luyện về bảo mật
- 📊 **Kiểm tra nội bộ:** Đánh giá rủi ro thường xuyên
- 🚨 **Phản hồi sự cố:** Quy trình xử lý sự cố

### 🏛️ **Tuân thủ pháp luật**
- 📜 **Luật An ninh mạng 2018**
- 📋 **Nghị định 13/2023/NĐ-CP**
- 🌐 **GDPR (chưa có ở VN)**
- ⚕️ **Luật Khám chữa bệnh**

---

## 📤 **CHIA SẺ DỮ LIỆU**

### ✅ **Khi được cho phép**
Chúng tôi chỉ chia sẻ dữ liệu khi:
- 👤 **Bạn đồng ý:** Cung cấp sự cho phép rõ ràng
- ⚕️ **Bác sĩ điều trị:** Để cung cấp dịch vụ y tế
- 🏥 **Bệnh viện đối tác:** Khi bạn khám tại đó
- 💊 **Nhà thuốc:** Để phát thuốc theo đơn
- 🏛️ **Cơ quan nhà nước:** Khi có yêu cầu pháp lý
- 🚨 **Trường hợp khẩn cấp:** Để cứu người

### ❌ **Khi không được phép**
Chúng tôi KHÔNG chia sẻ dữ liệu cho:
- 🏪 **Công ty quảng cáo**
- 📈 **Công ty phân tích dữ liệu**
- 🎯 **Công ty marketing**
- 👥 **Bên thứ ba không liên quan**

---

## 👤 **QUYỀN CỦA NGƯỜI DÙNG**

### 🔍 **Quyền được biết**
- 📋 **Biết dữ liệu:** Những thông tin nào được thu thập
- 🎯 **Biết mục đích:** Dữ liệu được sử dụng làm gì
- ⏰ **Biết thời gian:** Bao lâu dữ liệu được lưu trữ
- 👥 **Biết người nhận:** Ai được truy cập dữ liệu

### ✏️ **Quyền chỉnh sửa**
- 🔄 **Cập nhật thông tin:** Thay đổi thông tin cá nhân
- ❌ **Xóa thông tin:** Yêu cầu xóa dữ liệu không cần thiết
- 🚫 **Chặn truy cập:** Hạn chế quyền truy cập vào dữ liệu

### 📤 **Quyền xuất dữ liệu**
- 📋 **Yêu cầu dữ liệu:** Nhận bản sao dữ liệu của bạn
- 📄 **Định dạng phổ thông:** PDF, CSV, JSON
- 🆓 **Miễn phí:** Không tính phí cho việc xuất dữ liệu

### 🚫 **Quyền rút lại sự đồng ý**
- 🔙 **Thu hồi đồng ý:** Rút lại sự cho phép đã cấp
- ❌ **Ngừng xử lý:** Dừng xử lý dữ liệu liên quan
- 🗑️ **Xóa dữ liệu:** Yêu cầu xóa dữ liệu đã thu thập

---

## ⏰ **THỜI GIAN LƯU TRỮ DỮ LIỆU**

### 📅 **Thời gian lưu trữ theo loại dữ liệu**

| Loại dữ liệu | Thời gian lưu trữ | Lý do |
|-------------|-------------------|-------|
| 📝 Thông tin cá nhân | 5 năm sau khi xóa tài khoản | Yêu cầu pháp lý |
| 🏥 Hồ sơ y tế | 20 năm | Theo quy định y tế |
| 💰 Giao dịch tài chính | 7 năm | Theo quy định thuế |
| 📱 Dữ liệu kỹ thuật | 2 năm | Cải tiến dịch vụ |
| 🍪 Cookie | 1 năm | Trải nghiệm người dùng |

### 🗑️ **Chính sách xóa dữ liệu**
- 📧 **Thông báo trước:** 30 ngày trước khi xóa
- 🔄 **Sao lưu:** Lưu bản sao an toàn (nếu cần)
- ✅ **Xóa vĩnh viễn:** Không thể khôi phục sau khi xóa
- 📋 **Xác nhận:** Gửi xác nhận khi đã xóa

---

## 🌐 **COOKIE VÀ CÔNG NGHỆ THEO DÕI**

### 🍪 **Cookie là gì?**
Cookie là các tệp văn bản nhỏ được lưu trên trình duyệt của bạn để:
- 🔐 **Đăng nhập:** Giữ bạn đăng nhập
- 🛒 **Giỏ hàng:** Lưu trữ thông tin mua hàng
- 🎯 **Cá nhân hóa:** Tùy chỉnh trải nghiệm
- 📊 **Phân tích:** Hiểu cách bạn sử dụng trang

### 📋 **Loại Cookie sử dụng**
| Loại Cookie | Mục đích | Thời gian |
|-------------|----------|-----------|
| 🔒 Bắt buộc | Hoạt động cơ bản | Phiên làm việc |
| 🎯 Hiệu suất | Tối ưu tốc độ | 1 năm |
| 📊 Phân tích | Thống kê sử dụng | 2 năm |
| 🎪 Quảng cáo | Gợi ý dịch vụ | 6 tháng |

### 🔧 **Quản lý Cookie**
- ❌ **Tắt Cookie:** Có thể ảnh hưởng đến trải nghiệm
- 🔍 **Xem Cookie:** Kiểm tra các cookie đang lưu
- 🗑️ **Xóa Cookie:** Xóa lịch sử duyệt web

---

## 👶 **BẢO VỆ TRẺ EM**

### 🚫 **Chúng tôi không thu thập dữ liệu của trẻ em**
- 🔞 **Độ tuổi tối thiểu:** 18 tuổi để sử dụng dịch vụ
- 👨‍👩‍👧‍👦 **Phụ huynh đồng ý:** Cần có sự đồng ý của phụ huynh
- 📝 **Giới hạn dịch vụ:** Chỉ các dịch vụ phù hợp
- 🛡️ **Bảo vệ đặc biệt:** Áp dụng biện pháp bảo vệ tăng cường

### 👨‍👩‍👧‍👦 **Trách nhiệm phụ huynh**
- 📱 **Giám sát:** Theo dõi hoạt động của con em
- 🎓 **Giáo dục:** Dạy về an toàn internet
- 🔒 **Thiết lập:** Cài đặt các tính năng bảo mật
- 📞 **Liên hệ:** Báo cáo các vấn đề phát sinh

---

## 🚨 **XỬ LÝ SỰ CỐ BẢO MẬT**

### 📋 **Quy trình khi phát hiện rò rỉ**
1. 🚨 **Xác nhận sự cố:** Kiểm tra và xác minh
2. 🔒 **Ngăn chặn:** Khóa tài khoản bị ảnh hưởng
3. 📧 **Thông báo:** Báo cho người dùng trong 72 giờ
4. 🔍 **Điều tra:** Tìm nguyên nhân và mức độ ảnh hưởng
5. 🛠️ **Khắc phục:** Sửa lỗi và gia tăng bảo mật
6. 📊 **Báo cáo:** Báo cơ quan chức năng (nếu cần)

### 📞 **Khi bạn nghi ngờ bị xâm phạm**
- 🔄 **Đổi mật khẩu ngay lập tức**
- 📞 **Liên hệ chúng tôi:** 1900-xxxx
- 📧 **Email:** security@sepolia-health.vn
- 🏛️ **Báo công an:** Nếu nghiêm trọng

---

## 📞 **LIÊN HỆ VỀ QUYỀN RIÊNG TƯ**

**Đội ngũ Bảo vệ Dữ liệu cá nhân**
- ☎️ **Hotline:** 1900-xxxx (nhánh 3)
- 📧 **Email:** privacy@sepolia-health.vn
- 🏢 **Địa chỉ:** 123 Nguyễn Huệ, Q.1, TP.HCM
- 🕒 **Giờ làm việc:** 8:00 - 17:30 (Thứ 2 - Thứ 6)

**Người liên hệ chính:**
- 👨‍💼 **Chuyên viên bảo vệ dữ liệu:** Nguyễn Thị B
- 📱 **Điện thoại:** 09xx-xxx-xxx
- 📧 **Email:** nguyenb@sepolia-health.vn

---

## 🔄 **CẬP NHẬT CHÍNH SÁCH**

### 📅 **Thời gian cập nhật**
- 🔄 **Định kỳ:** 6 tháng/lần
- 📧 **Thông báo:** 30 ngày trước khi thay đổi
- 📱 **Thông báo trong app:** Push notification
- 🌐 **Cập nhật website:** Thông báo trên trang chủ

### 💡 **Cải tiến liên tục**
- 📊 **Phản hồi người dùng:** Thu thập ý kiến
- 🛠️ **Công nghệ mới:** Áp dụng các biện pháp bảo mật mới
- 🏛️ **Pháp luật:** Cập nhật theo quy định pháp luật
- 🌐 **Quy chuẩn quốc tế:** Học hỏi các chuẩn mực tốt nhất

---

*Bằng việc sử dụng dịch vụ của Sepolia Health, bạn đồng ý với chính sách bảo vệ dữ liệu cá nhân này.*

*Phiên bản: 1.0 | Hiệu lực từ ngày 01/01/2024*`,
  },
];

async function main() {
  console.log('--- BẮT ĐẦU SEED APP TERMS DATA ---\n');

  // ---- BƯỚC 1: XÓA DỮ LIỆU APP TERMS CŨ ----
  console.log('--- Bước 1: Xóa dữ liệu AppTerms cũ...');
  await prisma.appTerms.deleteMany({});
  console.log('✅ Đã xóa tất cả dữ liệu AppTerms cũ');

  // ---- BƯỚC 2: TẠO APP TERMS MỚI ----
  console.log('\n--- Bước 2: Tạo AppTerms mới...');

  for (let i = 0; i < appTermsData.length; i++) {
    const term = appTermsData[i];
    await prisma.appTerms.create({
      data: {
        type: term.type,
        title: term.title,
        content: term.content,
        version: 1,
        isActive: true,
      }
    });

    const typeName = term.type.replace('APP_', '');
    console.log(`   [${i + 1}/${appTermsData.length}] Đã tạo ${typeName}: "${term.title}"`);
  }

  console.log(`✅ Đã tạo ${appTermsData.length} AppTerms`);

  // ---- SUMMARY ----
  console.log(
    `\n✅ HOÀN THÀNH SEED APP TERMS DATA!
     - ${appTermsData.length} điều khoản đã được tạo thành công
     - Tất cả điều khoản đều được kích hoạt và sẵn sàng sử dụng
     - Bao gồm 4 loại:
       • APP_FAQ - Câu hỏi thường gặp
       • USAGE_REGULATIONS - Quy định sử dụng
       • DISPUTE_RESOLUTION - Chính sách giải quyết khiếu nại
       • PRIVACY_POLICY - Chính sách bảo vệ dữ liệu cá nhân`,
  );
}

main()
  .catch((e) => {
    console.error('Lỗi nghiêm trọng trong quá trình seed FAQ data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });