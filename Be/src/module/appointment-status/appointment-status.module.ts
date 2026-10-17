import { PrismaModule } from '@/common/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AppointmentStatusService } from './appointment-status.service';

@Module({
  imports: [PrismaModule],
  providers: [AppointmentStatusService],
  exports: [AppointmentStatusService],
})
export class AppointmentStatusModule {}
