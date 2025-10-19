import { Module } from '@nestjs/common';
import { AdminStatisticsController } from './admin-statistics.controller';
import { AdminStatisticsService } from './admin-statistics.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminStatisticsController],
  providers: [AdminStatisticsService],
  exports: [AdminStatisticsService],
})
export class AdminStatisticsModule {}
