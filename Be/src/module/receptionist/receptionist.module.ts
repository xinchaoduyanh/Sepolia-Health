import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ReceptionistAppointmentService } from './appointment/receptionist-appointment.service';
import { ReceptionistAppointmentProcessor } from './appointment/receptionist-appointment.processor';
import { ReceptionistAppointmentController } from './appointment/receptionist-appointment.controller';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'appointment' })],
  controllers: [ReceptionistAppointmentController],
  providers: [ReceptionistAppointmentService, ReceptionistAppointmentProcessor],
})
export class ReceptionistModule {}
