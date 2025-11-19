import { Module } from '@nestjs/common';
import { AppTermsController } from './app-terms.controller';
import { AppTermsService } from './app-terms.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppTermsController],
  providers: [AppTermsService],
  exports: [AppTermsService],
})
export class AppTermsModule {}
