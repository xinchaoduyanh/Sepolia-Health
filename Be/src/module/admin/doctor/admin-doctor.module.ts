import { Module } from '@nestjs/common';
import { AdminDoctorController } from './admin-doctor.controller';
import { AdminDoctorService } from './admin-doctor.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminDoctorController],
  providers: [AdminDoctorService],
  exports: [AdminDoctorService],
})
export class AdminDoctorModule {}
