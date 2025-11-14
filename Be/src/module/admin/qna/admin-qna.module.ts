import { Module } from '@nestjs/common';
import { AdminQnaController } from './admin-qna.controller';
import { AdminQnaService } from './admin-qna.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { QnaModule } from '@/module/qna/qna.module';

@Module({
  imports: [PrismaModule, QnaModule],
  controllers: [AdminQnaController],
  providers: [AdminQnaService],
  exports: [AdminQnaService],
})
export class AdminQnaModule {}



