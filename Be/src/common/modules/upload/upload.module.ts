import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@/common/config';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
