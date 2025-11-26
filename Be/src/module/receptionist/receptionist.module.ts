import { Module } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ReceptionistAppointmentService } from './appointment/receptionist-appointment.service';
import { ReceptionistAppointmentController } from './appointment/receptionist-appointment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReceptionistAppointmentController],
  providers: [ReceptionistAppointmentService],
})
export class ReceptionistModule { }
