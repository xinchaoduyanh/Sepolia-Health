import { Inject, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { SendEmailOptions, EmailResult } from './mail.types';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@/common/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly emailConf: ConfigType<typeof appConfig>,
  ) {
    this.resend = new Resend(this.emailConf.resendApiKey);
    this.fromEmail = this.emailConf.fromEmail;
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
}
