import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtTokens,
  TokenPayload,
  GenerateTokenOptions,
  VerifyTokenResult,
} from './jwt.types';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class CustomJwtService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly jwtConf: ConfigType<typeof appConfig>,
    private jwtService: JwtService,
  ) {}

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    return this.jwtService.sign(payload, {
      secret: this.jwtConf.refreshSecret,
      expiresIn: this.jwtConf.refreshTokenExpiresIn,
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
      let secret = this.jwtConf.secret;

      if (type === 'refresh') {
        secret = this.jwtConf.refreshSecret;
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
    };

    switch (options.type) {
      case 'refresh':
        return this.generateRefreshToken(payload);
      default:
        return this.generateAccessToken(payload);
    }
  }
}
