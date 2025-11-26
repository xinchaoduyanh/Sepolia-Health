import { Module } from '@nestjs/common';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DoctorAppointmentController],
  providers: [DoctorAppointmentService],
  exports: [DoctorAppointmentService],
})
export class DoctorAppointmentModule {}
