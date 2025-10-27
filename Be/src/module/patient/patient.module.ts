import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UserModule, AppointmentModule, DoctorModule, UploadModule],
  exports: [UserModule, AppointmentModule, DoctorModule, UploadModule],
})
export class PatientModule {}
