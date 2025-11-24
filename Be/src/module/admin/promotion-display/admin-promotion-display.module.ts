import { Module } from '@nestjs/common';
import { AdminPromotionDisplayController } from './admin-promotion-display.controller';
import { AdminPromotionDisplayService } from './admin-promotion-display.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPromotionDisplayController],
  providers: [AdminPromotionDisplayService],
  exports: [AdminPromotionDisplayService],
})
export class AdminPromotionDisplayModule {}
