import { Logger, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import IORedis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [appConfig.KEY],
      useFactory: async (redisConf: ConfigType<typeof appConfig>) => {
        const logger = new Logger('RedisModule');
        const redisClient = new IORedis(redisConf.redisUrl);

        redisClient.on('error', (err) => {
          logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
          logger.log('Redis Client Connected');
        });

        redisClient.on('disconnect', () => {
          logger.log('Redis Client Disconnected');
        });

        return redisClient;
      },
    },
    RedisService,
  ],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
