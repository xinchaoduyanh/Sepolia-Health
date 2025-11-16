import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'appointment' })],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
