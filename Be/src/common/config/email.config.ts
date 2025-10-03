import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  fromEmail: process.env.FROM_EMAIL,
  resendApiKey: process.env.RESEND_API_KEY,
}));
