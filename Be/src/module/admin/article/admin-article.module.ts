import { Module } from '@nestjs/common';
import { AdminArticleController } from './admin-article.controller';
import { AdminArticleService } from './admin-article.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminArticleController],
  providers: [AdminArticleService],
  exports: [AdminArticleService],
})
export class AdminArticleModule {}
