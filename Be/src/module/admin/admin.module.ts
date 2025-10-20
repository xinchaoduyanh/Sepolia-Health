import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminPatientModule } from './patient/admin-patient.module';
import { AdminDoctorModule } from './doctor/admin-doctor.module';
import { AdminReceptionistModule } from './receptionist/admin-receptionist.module';
import { AdminStatisticsModule } from './statistics/admin-statistics.module';
import { AdminAppointmentModule } from './appointment/admin-appointment.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminPatientModule,
    AdminDoctorModule,
    AdminReceptionistModule,
    AdminStatisticsModule,
    AdminAppointmentModule,
  ],
  exports: [
    AdminAuthModule,
    AdminPatientModule,
    AdminDoctorModule,
    AdminReceptionistModule,
    AdminStatisticsModule,
    AdminAppointmentModule,
  ],
})
export class AdminModule {}
