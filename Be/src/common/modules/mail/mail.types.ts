export interface BaseEmailData {
  email: string;
}

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

export interface ResetPasswordEmailData extends BaseEmailData {
  resetLink: string;
  expiresIn: number;
}

export interface EmailVerificationData extends BaseEmailData {
  otp: string;
}

export interface ForgotPasswordOtpEmailData extends BaseEmailData {
  otp: string;
}
