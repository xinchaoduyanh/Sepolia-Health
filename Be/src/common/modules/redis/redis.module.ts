import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '../../config';

@Module({
  providers: [RedisService, ConfigService],
  exports: [RedisService],
})
export class RedisModule {}
