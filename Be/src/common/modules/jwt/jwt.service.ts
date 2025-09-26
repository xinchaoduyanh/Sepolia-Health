import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config';
import {
  JwtTokens,
  TokenPayload,
  GenerateTokenOptions,
  VerifyTokenResult,
} from './jwt.types';

@Injectable()
export class CustomJwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    const jwtConfig = this.configService.getJwtConfig();
    return this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    const jwtConfig = this.configService.getJwtConfig();
    return this.jwtService.sign(payload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(payload: Omit<TokenPayload, 'exp' | 'iat'>): JwtTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify and decode token
   */
  verifyToken(
    token: string,
    type: 'access' | 'refresh' = 'access',
  ): VerifyTokenResult {
    try {
      const jwtConfig = this.configService.getJwtConfig();
      let secret: string;

      switch (type) {
        case 'access':
          secret = jwtConfig.secret;
          break;
        case 'refresh':
          secret = jwtConfig.refreshSecret;
          break;
        default:
          secret = jwtConfig.secret;
      }

      const payload = this.jwtService.verify(token, { secret });
      return {
        valid: true,
        payload: payload as TokenPayload,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(
    token: string,
    type: 'access' | 'refresh' = 'access',
  ): boolean {
    try {
      const result = this.verifyToken(token, type);
      if (!result.valid || !result.payload) return true;

      return Date.now() >= result.payload.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Generate token with options
   */
  generateTokenWithOptions(options: GenerateTokenOptions): string {
    const payload: Omit<TokenPayload, 'exp' | 'iat'> = {
      userId: options.userId,
      role: options.role,
      type: options.type || 'access',
    };

    switch (options.type) {
      case 'refresh':
        return this.generateRefreshToken(payload);
      default:
        return this.generateAccessToken(payload);
    }
  }
}
