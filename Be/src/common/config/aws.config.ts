import { registerAs } from '@nestjs/config';
import parsed from './config.validation';

export default registerAs('aws', () => ({
  accessKeyId: parsed.AWS_ACCESS_KEY_ID,
  secretAccessKey: parsed.AWS_SECRET_ACCESS_KEY,
  region: parsed.AWS_REGION,
  bucketName: parsed.AWS_S3_BUCKET_NAME,
  bucketUrl: parsed.AWS_S3_BUCKET_URL,
}));
