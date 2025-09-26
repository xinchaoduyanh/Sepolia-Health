import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigService } from '../../config';

@Module({
  providers: [MailService, ConfigService],
  exports: [MailService],
})
export class MailModule {}
