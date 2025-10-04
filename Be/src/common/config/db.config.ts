import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('db', () => ({
  dbUrl: parsed.DATABASE_URL,
}));
