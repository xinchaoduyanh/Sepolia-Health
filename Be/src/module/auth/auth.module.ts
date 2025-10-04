import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { JwtAuthModule, MailModule, RedisModule } from '@/common/modules';
import { jwtConfig, tokenStorageConfig } from '@/common/config';

@Module({
  imports: [
    ConfigModule.forFeature(tokenStorageConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: async (jwtConf: ConfigType<typeof jwtConfig>) => ({
        secret: jwtConf.secret,
        signOptions: { expiresIn: jwtConf.expiresIn },
      }),
    }),
    PrismaModule,
    JwtAuthModule,
    RedisModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
