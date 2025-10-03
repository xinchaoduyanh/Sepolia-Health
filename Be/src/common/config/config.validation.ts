import z from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  FROM_EMAIL: z.string(),
  RESEND_API_KEY: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string(),
  JWT_EXPIRES_IN: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  // Token storage expiration times (in seconds)
  TOKEN_ACCESS_EXPIRES_IN_SECONDS: z.string().default('900'), // 15 minutes
  TOKEN_REFRESH_EXPIRES_IN_SECONDS: z.string().default('604800'), // 7 days
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_BUCKET_NAME: z.string(),
  AWS_S3_BUCKET_URL: z.string(),
});

export default configSchema;
