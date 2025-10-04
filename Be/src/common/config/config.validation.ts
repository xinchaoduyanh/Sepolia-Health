import z from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
  REDIS_URL: z.string().nonempty(),
  //email
  FROM_EMAIL: z.string().nonempty(),
  RESEND_API_KEY: z.string().nonempty(),
  JWT_SECRET: z.string().nonempty(),
  FRONTEND_URL: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().nonempty(),
  JWT_REFRESH_SECRET: z.string().nonempty(),
  JWT_REFRESH_EXPIRES_IN: z.string().nonempty(),
  // Token storage expiration times (in seconds)
  TOKEN_ACCESS_EXPIRES_IN_SECONDS: z.string().default('900'), // 15 minutes
  TOKEN_REFRESH_EXPIRES_IN_SECONDS: z.string().default('604800'), // 7 days
  //aws
  AWS_ACCESS_KEY_ID: z.string().nonempty(),
  AWS_SECRET_ACCESS_KEY: z.string().nonempty(),
  AWS_REGION: z.string().nonempty(),
  AWS_S3_BUCKET_NAME: z.string().nonempty(),
  AWS_S3_BUCKET_URL: z.string().nonempty(),
});

const parsed = configSchema.parse(process.env);
export default parsed;
