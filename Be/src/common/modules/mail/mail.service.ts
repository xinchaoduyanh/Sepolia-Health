import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '../../config';
import {
  SendEmailOptions,
  EmailResult,
  WelcomeEmailData,
  ResetPasswordEmailData,
} from './mail.types';
import {
  getWelcomeEmailTemplate,
  getResetPasswordEmailTemplate,
  getAppointmentConfirmationTemplate,
  AppointmentConfirmationData,
} from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.getEmailConfig();

    this.resend = new Resend(emailConfig.resendApiKey);
    this.fromEmail = emailConfig.fromEmail;
  }

  /**
   * Send email using Resend
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }

      this.logger.log(`Email sent successfully to ${options.to}`);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
  ): Promise<EmailResult> {
    const template = getWelcomeEmailTemplate(data);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
    });
  }

  /**
   * Send reset password email
   */
  async sendResetPasswordEmail(
    to: string,
    data: ResetPasswordEmailData,
  ): Promise<EmailResult> {
    const template = getResetPasswordEmailTemplate(data);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
    });
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmationEmail(
    to: string,
    data: AppointmentConfirmationData,
  ): Promise<EmailResult> {
    const template = getAppointmentConfirmationTemplate(data);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
    });
  }
}
