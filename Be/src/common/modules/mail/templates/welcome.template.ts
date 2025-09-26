import { WelcomeEmailData } from '../mail.types';

export const getWelcomeEmailTemplate = (data: WelcomeEmailData) => {
  return {
    subject: `Chào mừng đến với ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng đến với ${data.clinicName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .welcome-title {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${data.clinicName}</div>
            <h1 class="welcome-title">Chào mừng ${data.userName}!</h1>
          </div>
          
          <div class="content">
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>${data.clinicName}</strong>.</p>
            <p>Chúng tôi rất vui được chào đón bạn đến với hệ thống quản lý phòng khám hiện đại.</p>
            
            <p>Bạn có thể bắt đầu sử dụng dịch vụ ngay bây giờ:</p>
            <a href="${data.loginUrl}" class="button">Đăng nhập ngay</a>
            
            <p>Với tài khoản của bạn, bạn có thể:</p>
            <ul>
              <li>Đặt lịch khám bệnh trực tuyến</li>
              <li>Xem lịch sử khám bệnh</li>
              <li>Thanh toán hóa đơn</li>
              <li>Nhận thông báo về lịch hẹn</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống ${data.clinicName}</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};
