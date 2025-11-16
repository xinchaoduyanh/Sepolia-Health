import { ForgotPasswordOtpEmailData } from '../mail.types';

export const getForgotPasswordOtpTemplate = (
  data: ForgotPasswordOtpEmailData,
) => {
  return {
    to: data.email,
    subject: 'Mã xác thực đặt lại mật khẩu - Phòng khám Sepolia',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Phòng khám Sepolia</h1>
            <h2 style="color: #3498db;">Đặt lại mật khẩu</h2>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Phòng khám Sepolia</strong>.</p>
            <p>Mã xác thực của bạn là:</p>

            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #e74c3c; background-color: #fff; padding: 15px 30px; border-radius: 10px; border: 2px dashed #e74c3c;">${data.otp}</span>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                <li>Mã xác thực có hiệu lực trong <strong>5 phút</strong></li>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              </ul>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #7f8c8d;">
            <p>Email này được gửi tự động từ hệ thống Phòng khám Sepolia</p>
            <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
          </div>
        </div>
      `,
  };
};
