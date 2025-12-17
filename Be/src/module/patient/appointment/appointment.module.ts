import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { BookingController } from './booking.controller';
import { MeetingModule } from '@/module/meeting/meeting.module';

@Module({
  imports: [PrismaModule, MeetingModule],
  controllers: [AppointmentController, BookingController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
