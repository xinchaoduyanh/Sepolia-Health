import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { JwtAuthModule, MailModule, RedisModule } from '@/common/modules';
import { tokenStorageConfig } from '@/common/config';

@Module({
  imports: [
    ConfigModule.forFeature(tokenStorageConfig),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
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
