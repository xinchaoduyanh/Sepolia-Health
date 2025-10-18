import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@/common/config';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
