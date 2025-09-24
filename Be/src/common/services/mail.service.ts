import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('FROM_EMAIL') ||
      'noreply@sepolia-clinic.com';
  }

  /**
   * Send email using Resend
   */
  async sendEmail(
    options: SendEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.logger.log(`Sending email to: ${options.to}`);

      const result = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(
        `Email sent successfully. Message ID: ${result.data?.id}`,
      );

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send registration verification email with OTP
   */
  async sendRegisterMail(
    email: string,
    otp: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Xác thực đăng ký tài khoản - Sepolia Clinic';
    const html = this.generateRegisterEmailTemplate(otp, name);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetMail(
    email: string,
    resetToken: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Khôi phục mật khẩu - Sepolia Clinic';
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = this.generatePasswordResetEmailTemplate(resetUrl, name);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmationMail(
    email: string,
    appointmentDetails: {
      doctorName: string;
      date: string;
      time: string;
      location: string;
    },
    name?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = 'Xác nhận lịch hẹn - Sepolia Clinic';
    const html = this.generateAppointmentConfirmationTemplate(
      appointmentDetails,
      name,
    );

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Generate registration email template
   */
  private generateRegisterEmailTemplate(otp: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực đăng ký</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-box { background: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sepolia Clinic</h1>
            <p>Hệ thống quản lý phòng khám</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name || 'Bạn'}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Sepolia Clinic.</p>
            <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP sau:</p>
            
            <div class="otp-box">
              <p>Mã xác thực của bạn:</p>
              <div class="otp-code">${otp}</div>
              <p><small>Mã này có hiệu lực trong 10 phút</small></p>
            </div>
            
            <p>Nếu bạn không yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ Sepolia Clinic</p>
          </div>
          <div class="footer">
            <p>© 2024 Sepolia Clinic. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset email template
   */
  private generatePasswordResetEmailTemplate(
    resetUrl: string,
    name?: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Khôi phục mật khẩu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sepolia Clinic</h1>
            <p>Khôi phục mật khẩu</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name || 'Bạn'}!</h2>
            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            <p>Liên kết này có hiệu lực trong 1 giờ.</p>
            <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ Sepolia Clinic</p>
          </div>
          <div class="footer">
            <p>© 2024 Sepolia Clinic. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate appointment confirmation email template
   */
  private generateAppointmentConfirmationTemplate(
    appointmentDetails: {
      doctorName: string;
      date: string;
      time: string;
      location: string;
    },
    name?: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận lịch hẹn</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .appointment-details { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sepolia Clinic</h1>
            <p>Xác nhận lịch hẹn</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name || 'Bạn'}!</h2>
            <p>Lịch hẹn của bạn đã được xác nhận thành công.</p>
            
            <div class="appointment-details">
              <h3>Chi tiết lịch hẹn:</h3>
              <p><strong>Bác sĩ:</strong> ${appointmentDetails.doctorName}</p>
              <p><strong>Ngày:</strong> ${appointmentDetails.date}</p>
              <p><strong>Giờ:</strong> ${appointmentDetails.time}</p>
              <p><strong>Địa điểm:</strong> ${appointmentDetails.location}</p>
            </div>
            
            <p>Vui lòng đến đúng giờ hẹn. Nếu có thay đổi, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br>Đội ngũ Sepolia Clinic</p>
          </div>
          <div class="footer">
            <p>© 2024 Sepolia Clinic. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
