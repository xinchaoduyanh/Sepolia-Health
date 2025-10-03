import { registerAs } from '@nestjs/config';

export default registerAs('tokenStorage', () => ({
  accessTokenExpiresInSeconds: Number(
    process.env.TOKEN_ACCESS_EXPIRES_IN_SECONDS,
  ),
  refreshTokenExpiresInSeconds: Number(
    process.env.TOKEN_REFRESH_EXPIRES_IN_SECONDS,
  ),
}));
