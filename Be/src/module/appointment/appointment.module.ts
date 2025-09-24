import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentRepository } from './appointment.repository';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository],
  exports: [AppointmentService, AppointmentRepository],
})
export class AppointmentModule {}
