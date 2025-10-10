import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { TokenPayload } from '../types/jwt.type';
import { jwtConfig } from '../config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: (req) => {
        // Log tất cả headers để debug
        this.logger.debug('=== JWT TOKEN EXTRACTION DEBUG ===');
        this.logger.debug(
          'Request headers:',
          JSON.stringify(req.headers, null, 2),
        );

        // Extract token theo cách chuẩn
        const authHeader =
          req.headers.authorization || req.headers.Authorization;
        this.logger.debug(`Authorization header: "${authHeader}"`);

        if (!authHeader) {
          this.logger.debug('❌ No Authorization header found');
          return null;
        }

        if (!authHeader.startsWith('Bearer ')) {
          this.logger.debug(
            `❌ Authorization header does not start with "Bearer ": "${authHeader}"`,
          );
          return null;
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        this.logger.debug(`✅ Extracted token: ${token.substring(0, 20)}...`);
        this.logger.debug('=== END DEBUG ===');

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: jwtConf.secret,
    });
    this.logger.debug(
      `JWT Strategy initialized with secret: ${jwtConf.secret?.substring(0, 10)}...`,
    );
  }

  validate(payload: TokenPayload): TokenPayload {
    this.logger.debug(`JWT Strategy validate called with payload:`, payload);

    // Check if token is expired by comparing with current time
    const currentTime = Math.floor(Date.now() / 1000);
    this.logger.debug(
      `Current time: ${currentTime}, Token exp: ${payload.exp}`,
    );

    if (payload.exp && payload.exp < currentTime) {
      this.logger.debug(
        `Token expired! Current: ${currentTime}, Exp: ${payload.exp}`,
      );
      throw new UnauthorizedException('Token has expired');
    }

    this.logger.debug(`Token validation successful for user ${payload.userId}`);
    return payload;
  }
}
