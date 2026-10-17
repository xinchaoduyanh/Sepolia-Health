import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@/common/config';
import { TokenPayload } from './jwt.types';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly jwtConf: ConfigType<typeof appConfig>,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConf.secret,
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    // Check if token is expired by comparing with current time
    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < currentTime) {
      throw new UnauthorizedException('Token has expired');
    }

    // Kiểm tra mốc thu hồi token của người dùng
    if (payload.userId) {
      const revokedBefore = await this.redisService.getTokensRevokedBefore(
        payload.userId,
      );
      const issuedMs =
        payload.iatMs ?? (payload.iat ? payload.iat * 1000 : 0);

      if (revokedBefore !== null && issuedMs < revokedBefore) {
        this.logger.warn(
          `Token của user ${payload.userId} đã bị thu hồi (issued: ${issuedMs}, revokedBefore: ${revokedBefore})`,
        );
        throw new UnauthorizedException('Token đã bị thu hồi');
      }
    }

    return payload;
  }
}
