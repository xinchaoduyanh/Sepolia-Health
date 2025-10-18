import { registerAs } from '@nestjs/config';
import { configSchema } from './config.validation';

export default registerAs('app', () => {
  const parsed = configSchema.parse(process.env);
  return {
    dbUrl: parsed.DATABASE_URL,
    accessKeyId: parsed.AWS_ACCESS_KEY_ID,
    secretAccessKey: parsed.AWS_SECRET_ACCESS_KEY,
    region: parsed.AWS_REGION,
    bucketName: parsed.AWS_S3_BUCKET_NAME,
    bucketUrl: parsed.AWS_S3_BUCKET_URL,
    fromEmail: parsed.FROM_EMAIL,
    resendApiKey: parsed.RESEND_API_KEY,
    frontendUrl: parsed.FRONTEND_URL,
    secret: parsed.JWT_SECRET,
    expiresIn: parsed.JWT_EXPIRES_IN,
    refreshSecret: parsed.JWT_REFRESH_SECRET,
    refreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
    redisUrl: parsed.REDIS_URL,
    accessTokenExpiresInSeconds: Number(parsed.TOKEN_ACCESS_EXPIRES_IN_SECONDS),
    refreshTokenExpiresInSeconds: Number(
      parsed.TOKEN_REFRESH_EXPIRES_IN_SECONDS,
    ),
  };
});
