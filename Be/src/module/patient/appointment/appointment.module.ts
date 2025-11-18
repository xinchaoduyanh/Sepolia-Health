import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { BookingController } from './booking.controller';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'appointment' })],
  controllers: [AppointmentController, BookingController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
