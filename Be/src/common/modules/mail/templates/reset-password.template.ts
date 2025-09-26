import { ResetPasswordEmailData } from '../mail.types';

export const getResetPasswordEmailTemplate = (data: ResetPasswordEmailData) => {
  return {
    subject: 'Đặt lại mật khẩu - Sepolia Clinic',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
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
          .title {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #e74c3c;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .warning {
            background-color: #fdf2f2;
            border: 1px solid #fecaca;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #dc2626;
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
            <div class="logo">Sepolia Clinic</div>
            <h1 class="title">Đặt lại mật khẩu</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${data.userName}</strong>,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình tại Sepolia Clinic.</p>
            
            <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            <a href="${data.resetLink}" class="button">Đặt lại mật khẩu</a>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul>
                <li>Liên kết này sẽ hết hạn sau <strong>${data.expiresIn}</strong></li>
                <li>Chỉ sử dụng liên kết này một lần</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              </ul>
            </div>
            
            <p>Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${data.resetLink}
            </p>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Sepolia Clinic</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};
