import { CommonModule } from '@/common/common.module';
import { appConfig } from '@/common/config';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { UserStatusGuard } from '@/common/guards/user-status.guard';
import { REDIS_CLIENT } from '@/common/modules';
import { CustomZodValidationPipe } from '@/common/pipes';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ChatModule } from '@/module/chat/chat.module';
import { ChatbotModule } from '@/module/chatbot/chatbot.module';
import { NotificationModule } from '@/module/notification/notification.module';
import { QnaModule } from '@/module/qna/qna.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import IORedis from 'ioredis';
import { AdminModule } from './admin/admin.module';
import { AppTermsModule } from './app-terms/app-terms.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CronJobModule } from './cron-job/cron-job.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { PaymentModule } from './payment/payment.module';
import { ReceptionistModule } from './receptionist/receptionist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    CommonModule,
    BullModule.forRootAsync({
      imports: [CommonModule],
      useFactory: (redisClient: IORedis) => ({
        connection: redisClient,
      }),
      inject: [REDIS_CLIENT],
    }),
    PrismaModule,
    AuthModule,
    PatientModule,
    AdminModule,
    ReceptionistModule,
    DoctorModule,
    PaymentModule,
    ChatModule,
    NotificationModule,
    QnaModule,
    ChatbotModule,
    AppTermsModule,
    CronJobModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
  ],
})
export class AppModule {}
