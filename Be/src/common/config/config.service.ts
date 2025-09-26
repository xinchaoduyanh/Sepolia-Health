import { Injectable } from '@nestjs/common';
import envConfig from '../../config';

@Injectable()
export class ConfigService {
  private readonly config = envConfig;

  /**
   * Get database URL
   */
  getDatabaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  /**
   * Get JWT configuration
   */
  getJwtConfig() {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      refreshSecret: this.config.JWT_REFRESH_SECRET,
      refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN,
    };
  }

  /**
   * Get email configuration
   */
  getEmailConfig() {
    return {
      fromEmail: this.config.FROM_EMAIL,
      resendApiKey: this.config.RESEND_API_KEY,
    };
  }

  /**
   * Get AWS S3 configuration
   */
  getAwsConfig() {
    return {
      accessKeyId: this.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
      region: this.config.AWS_REGION,
      bucketName: this.config.AWS_S3_BUCKET_NAME,
      bucketUrl: this.config.AWS_S3_BUCKET_URL,
    };
  }

  /**
   * Get frontend URL
   */
  getFrontendUrl(): string {
    return this.config.FRONTEND_URL;
  }

  /**
   * Get Redis URL
   */
  getRedisUrl(): string {
    return this.config.REDIS_URL;
  }

  /**
   * Generic method to get any config value
   */
  get<T = string>(key: keyof typeof this.config): T {
    return this.config[key] as T;
  }
}
