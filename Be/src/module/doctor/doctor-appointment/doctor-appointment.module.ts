import { UploadModule } from '@/common/modules';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { NotificationModule } from '@/module/notification/notification.module';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';

@Module({
  imports: [PrismaModule, UploadModule, NotificationModule],
  controllers: [DoctorAppointmentController],
  providers: [DoctorAppointmentService],
  exports: [DoctorAppointmentService],
})
export class DoctorAppointmentModule {}
