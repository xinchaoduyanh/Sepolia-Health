import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CustomJwtService } from './jwt.service';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [appConfig.KEY],
      useFactory: async (jwtConf: ConfigType<typeof appConfig>) => ({
        secret: jwtConf.secret,
        signOptions: { expiresIn: jwtConf.accessTokenExpiresIn },
      }),
    }),
  ],
  providers: [CustomJwtService, JwtStrategy],
  exports: [CustomJwtService, PassportModule, JwtStrategy],
})
export class JwtAuthModule {}
