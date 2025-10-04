import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('redis', () => ({
  redisUrl: parsed.REDIS_URL,
}));
