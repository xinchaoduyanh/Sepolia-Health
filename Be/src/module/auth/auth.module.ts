import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { JwtAuthModule, MailModule, RedisModule } from '@/common/modules';

@Module({
  imports: [PrismaModule, JwtAuthModule, RedisModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
