import { Module } from '@nestjs/common';
import {
  UploadModule,
  MailModule,
  JwtAuthModule,
  RedisModule,
} from './modules';
import { ConfigService } from './config';

@Module({
  imports: [UploadModule, MailModule, JwtAuthModule, RedisModule],
  providers: [ConfigService],
  exports: [
    UploadModule,
    MailModule,
    JwtAuthModule,
    RedisModule,
    ConfigService,
  ],
})
export class CommonModule {}
