import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('tokenStorage', () => ({
  accessTokenExpiresInSeconds: Number(parsed.TOKEN_ACCESS_EXPIRES_IN_SECONDS),
  refreshTokenExpiresInSeconds: Number(parsed.TOKEN_REFRESH_EXPIRES_IN_SECONDS),
}));
