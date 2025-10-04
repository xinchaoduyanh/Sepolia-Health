import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('email', () => ({
  fromEmail: parsed.FROM_EMAIL,
  resendApiKey: parsed.RESEND_API_KEY,
}));
