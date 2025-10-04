import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('jwt', () => ({
  secret: parsed.JWT_SECRET,
  expiresIn: parsed.JWT_EXPIRES_IN,
  refreshSecret: parsed.JWT_REFRESH_SECRET,
  refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
}));
