import { Module } from '@nestjs/common';
import { ReceptionistAppointmentService } from './appointment/receptionist-appointment.service';
import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [ReceptionistAppointmentService],
})
export class ReceptionistModule {}
