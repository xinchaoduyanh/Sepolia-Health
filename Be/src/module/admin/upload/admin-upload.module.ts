import { Module } from '@nestjs/common';
import { AdminUploadController } from './admin-upload.controller';
import { AdminUploadService } from './admin-upload.service';
import { UploadModule } from '@/common/modules/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AdminUploadController],
  providers: [AdminUploadService],
  exports: [AdminUploadService],
})
export class AdminUploadModule {}
