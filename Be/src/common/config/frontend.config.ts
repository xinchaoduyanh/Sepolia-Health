import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('frontend', () => ({
  frontendUrl: parsed.FRONTEND_URL,
}));
