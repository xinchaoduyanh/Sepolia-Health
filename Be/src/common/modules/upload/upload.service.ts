import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '../../config';
import { UploadFileOptions, UploadResult } from './upload.types';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly bucketUrl: string;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.getAwsConfig();

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });

    this.bucketName = awsConfig.bucketName;
    this.bucketUrl = awsConfig.bucketUrl;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType || 'application/octet-stream',
      });

      await this.s3Client.send(command);

      const fileUrl = `${this.bucketUrl}/${options.key}`;

      this.logger.log(`File uploaded successfully: ${fileUrl}`);

      return {
        success: true,
        url: fileUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get file from S3
   */
  async getFile(key: string): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        return null;
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const reader = response.Body.transformToByteArray();
      const result = await reader;

      chunks.push(Buffer.from(result));

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate presigned URL for file upload
   */
  generateUploadUrl(key: string): string {
    return `${this.bucketUrl}/${key}`;
  }
}
