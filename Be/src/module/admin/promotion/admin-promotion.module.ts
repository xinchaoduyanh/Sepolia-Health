import { Module } from '@nestjs/common';
import { AdminPromotionController } from './admin-promotion.controller';
import { AdminPromotionService } from './admin-promotion.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPromotionController],
  providers: [AdminPromotionService],
  exports: [AdminPromotionService],
})
export class AdminPromotionModule {}
