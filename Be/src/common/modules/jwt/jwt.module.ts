import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomJwtService } from './jwt.service';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from '@/common/config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.register({}), // JWT module sẽ được config trong service
  ],
  providers: [CustomJwtService],
  exports: [CustomJwtService],
})
export class JwtAuthModule {}
