import { Module } from '@nestjs/common';
import { AdminTagController } from './admin-tag.controller';
import { AdminTagService } from './admin-tag.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminTagController],
  providers: [AdminTagService],
  exports: [AdminTagService],
})
export class AdminTagModule {}
