import { registerAs } from '@nestjs/config';

export default registerAs('frontend', () => ({
  frontendUrl: process.env.FRONTEND_URL,
}));
