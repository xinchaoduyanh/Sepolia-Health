import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [UploadController],
})
export class UploadModule {}
