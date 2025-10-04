import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { awsConfig } from '@/common/config';

@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
