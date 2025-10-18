import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from './auth/auth.module';
import { APP_PIPE } from '@nestjs/core';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { ReceptionistModule } from './receptionist/receptionist.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { CustomZodValidationPipe } from '@/common/pipes';
import { configSchema } from '@/common/config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (env) => configSchema.parse(env),
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    AppointmentModule,
    DoctorModule,
    ReceptionistModule,
    UploadModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
  ],
})
export class AppModule {}
