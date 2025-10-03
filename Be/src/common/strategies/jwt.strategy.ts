import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { TokenPayload } from '../types/jwt.type';
import { CustomJwtService } from '../modules';
import { jwtConfig } from '../config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private jwtAuthService: CustomJwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConf.secret,
    });
  }

  validate(payload: TokenPayload): TokenPayload {
    // Check if token is expired
    if (this.jwtAuthService.isTokenExpired(payload.exp.toString())) {
      throw new UnauthorizedException('Token has expired');
    }

    // You can add additional validation here
    // e.g., check if user still exists in database
    // const user = await this.userService.findById(payload.userId);
    // if (!user) {
    //   throw new UnauthorizedException('User not found');
    // }

    return payload;
  }
}
