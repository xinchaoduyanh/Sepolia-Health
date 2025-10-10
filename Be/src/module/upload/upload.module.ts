import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CommonModule } from '@/common/common.module';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, PrismaModule, AuthModule],
  controllers: [UploadController],
})
export class UploadModule {}
