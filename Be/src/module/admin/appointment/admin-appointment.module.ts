import { Module } from '@nestjs/common';
import { AdminAppointmentController } from './admin-appointment.controller';
import { AdminAppointmentService } from './admin-appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAppointmentController],
  providers: [AdminAppointmentService],
  exports: [AdminAppointmentService],
})
export class AdminAppointmentModule {}
