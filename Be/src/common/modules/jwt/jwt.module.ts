import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomJwtService } from './jwt.service';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from '@/common/config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // JWT module sẽ được config trong service
  ],
  providers: [CustomJwtService, JwtStrategy],
  exports: [CustomJwtService, PassportModule, JwtStrategy],
})
export class JwtAuthModule {}
