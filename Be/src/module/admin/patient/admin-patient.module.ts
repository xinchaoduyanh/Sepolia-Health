import { Module } from '@nestjs/common';
import { AdminPatientController } from './admin-patient.controller';
import { AdminPatientService } from './admin-patient.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPatientController],
  providers: [AdminPatientService],
  exports: [AdminPatientService],
})
export class AdminPatientModule {}
