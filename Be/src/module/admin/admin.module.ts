import { Module } from '@nestjs/common';
import { AdminPatientModule } from './patient/admin-patient.module';
import { AdminDoctorModule } from './doctor/admin-doctor.module';
import { AdminReceptionistModule } from './receptionist/admin-receptionist.module';
import { AdminStatisticsModule } from './statistics/admin-statistics.module';
import { AdminAppointmentModule } from './appointment/admin-appointment.module';
import { AdminUploadModule } from './upload/admin-upload.module';
import { AdminArticleModule } from './article/admin-article.module';
import { AdminServiceModule } from './service/admin-service.module';
import { AdminClinicModule } from './clinic/admin-clinic.module';
import { AdminQnaModule } from './qna/admin-qna.module';

@Module({
  imports: [
    AdminPatientModule,
    AdminDoctorModule,
    AdminReceptionistModule,
    AdminStatisticsModule,
    AdminAppointmentModule,
    AdminUploadModule,
    AdminArticleModule,
    AdminServiceModule,
    AdminClinicModule,
    AdminQnaModule,
  ],
  exports: [
    AdminPatientModule,
    AdminDoctorModule,
    AdminReceptionistModule,
    AdminStatisticsModule,
    AdminAppointmentModule,
    AdminUploadModule,
    AdminArticleModule,
    AdminServiceModule,
    AdminClinicModule,
    AdminQnaModule,
  ],
})
export class AdminModule {}
