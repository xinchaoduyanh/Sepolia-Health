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
    expiresIn: parsed.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
    refreshSecret: parsed.JWT_REFRESH_SECRET,
    refreshExpiresIn:
      parsed.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
    redisUrl: parsed.REDIS_URL,
    accessTokenExpiresInSeconds: Number(parsed.TOKEN_ACCESS_EXPIRES_IN_SECONDS),
    refreshTokenExpiresInSeconds: Number(
      parsed.TOKEN_REFRESH_EXPIRES_IN_SECONDS,
    ),
    // sepay
    sepayApiKey: parsed.SEPAY_API_KEY,
    sepayAccountNumber: parsed.SEPAY_ACCOUNT_NUMBER,
    sepayBankCode: parsed.SEPAY_BANK_CODE,
    // stream chat
    streamChatApiKey: parsed.STREAM_CHAT_API_KEY,
    streamChatSecret: parsed.STREAM_CHAT_SECRET,
    // stream video
    streamVideoApiKey: parsed.STREAM_VIDEO_API_KEY,
    streamVideoSecret: parsed.STREAM_VIDEO_SECRET,
  };
});
