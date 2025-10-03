import { Module } from '@nestjs/common';
import {
  UploadModule,
  MailModule,
  JwtAuthModule,
  RedisModule,
} from './modules';

@Module({
  imports: [UploadModule, MailModule, JwtAuthModule, RedisModule],
  providers: [],
  exports: [UploadModule, MailModule, JwtAuthModule, RedisModule],
})
export class CommonModule {}
