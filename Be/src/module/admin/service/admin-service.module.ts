import { Module } from '@nestjs/common';
import { AdminServiceController } from './admin-service.controller';
import { AdminServiceService } from './admin-service.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminServiceController],
  providers: [AdminServiceService],
  exports: [AdminServiceService],
})
export class AdminServiceModule {}

