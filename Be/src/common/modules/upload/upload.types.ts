export interface UploadFileOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  bucketUrl: string;
}
