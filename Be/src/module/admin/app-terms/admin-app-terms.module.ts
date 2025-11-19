import { Module } from '@nestjs/common';
import { AdminAppTermsController } from './admin-app-terms.controller';
import { AdminAppTermsService } from './admin-app-terms.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAppTermsController],
  providers: [AdminAppTermsService],
  exports: [AdminAppTermsService],
})
export class AdminAppTermsModule {}
