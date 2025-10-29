import { Module } from '@nestjs/common';
import { AdminClinicController } from './admin-clinic.controller';
import { AdminClinicService } from './admin-clinic.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminClinicController],
  providers: [AdminClinicService],
  exports: [AdminClinicService],
})
export class AdminClinicModule {}
