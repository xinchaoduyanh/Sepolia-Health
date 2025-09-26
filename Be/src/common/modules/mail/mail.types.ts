export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConfig {
  fromEmail: string;
  resendApiKey: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  userName: string;
  clinicName: string;
  loginUrl: string;
}

export interface ResetPasswordEmailData {
  userName: string;
  resetLink: string;
  expiresIn: string;
}
