import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../types/jwt.type';

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtAuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    return this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutes
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
    return this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
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
  verifyToken(token: string): TokenPayload {
    return this.jwtService.verify(token);
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
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.verifyToken(token);
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
