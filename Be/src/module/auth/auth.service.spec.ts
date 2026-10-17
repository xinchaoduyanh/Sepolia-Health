jest.mock(
  'file-type',
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtAuthService: any;
  let mockMailService: any;
  let mockAuthRepository: any;
  let mockRedisService: any;
  let mockChatService: any;
  let mockTokenConf: any;

  beforeEach(() => {
    mockPrisma = {};
    mockJwtAuthService = {
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
      verifyToken: jest.fn(),
    };
    mockMailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };
    mockAuthRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      isEmailExists: jest.fn().mockResolvedValue(true),
      updateUser: jest.fn(),
    };
    mockRedisService = {
      setTokensRevokedBefore: jest.fn().mockResolvedValue(true),
      getTokensRevokedBefore: jest.fn().mockResolvedValue(null),
      checkAndSetOtpCooldown: jest.fn().mockResolvedValue(true),
      setOtp: jest.fn().mockResolvedValue(true),
      verifyOtp: jest.fn().mockResolvedValue(true),
    };
    mockChatService = {
      upsertUserToStreamChat: jest.fn().mockResolvedValue(true),
    };
    mockTokenConf = {
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 604800,
    };

    authService = new AuthService(
      mockPrisma,
      mockJwtAuthService,
      mockMailService,
      mockAuthRepository,
      mockRedisService,
      mockChatService,
      mockTokenConf,
    );
  });

  describe('logout', () => {
    it('logout gọi setTokensRevokedBefore với userId và timestamp hiện tại', async () => {
      const userId = 10;
      const beforeTime = Date.now();

      await authService.logout(userId);

      expect(mockRedisService.setTokensRevokedBefore).toHaveBeenCalledTimes(1);
      const [calledUserId, calledTimestamp] =
        mockRedisService.setTokensRevokedBefore.mock.calls[0];

      expect(calledUserId).toBe(userId);
      expect(calledTimestamp).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('refreshToken', () => {
    it('từ chối refresh token phát hành trước mốc revokedBefore', async () => {
      const userId = 10;
      const revokedBefore = 2000000;
      const tokenIatMs = 1500000; // Nhỏ hơn mốc revokedBefore

      mockJwtAuthService.verifyToken.mockReturnValue({
        valid: true,
        payload: {
          userId,
          role: 'PATIENT',
          iatMs: tokenIatMs,
        },
      });

      mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBefore);

      await expect(
        authService.refreshToken({ refreshToken: 'valid-signature-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRedisService.getTokensRevokedBefore).toHaveBeenCalledWith(
        userId,
      );
      expect(mockAuthRepository.findById).not.toHaveBeenCalled();
    });

    it('cho phép refresh token khi mốc phát hành hợp lệ và trả token mới', async () => {
      const userId = 10;
      const revokedBefore = 1000000;
      const tokenIatMs = 2000000; // Lớn hơn mốc revokedBefore

      mockJwtAuthService.verifyToken.mockReturnValue({
        valid: true,
        payload: {
          userId,
          role: 'PATIENT',
          iatMs: tokenIatMs,
        },
      });

      mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBefore);
      mockAuthRepository.findById.mockResolvedValue({
        id: userId,
        role: 'PATIENT',
        status: UserStatus.ACTIVE,
      });

      const result = await authService.refreshToken({
        refreshToken: 'valid-token',
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });
  });

  describe('OTP cooldown', () => {
    it('gửi OTP lần 2 trong cooldown → BadRequestException', async () => {
      const registerDto = { email: 'cooldown-test@example.com' };

      // Lần 1: Cooldown cho phép
      mockRedisService.checkAndSetOtpCooldown.mockResolvedValueOnce(true);
      await authService.register(registerDto as any);
      expect(mockRedisService.setOtp).toHaveBeenCalledTimes(1);

      // Lần 2: Cooldown từ chối (vẫn còn trong 60s)
      mockRedisService.checkAndSetOtpCooldown.mockResolvedValueOnce(false);
      const secondCall = authService.register(registerDto as any);
      await expect(secondCall).rejects.toThrow(BadRequestException);
      await expect(secondCall).rejects.toThrow(
        'Vui lòng đợi trước khi yêu cầu mã OTP mới',
      );
      expect(mockRedisService.setOtp).toHaveBeenCalledTimes(1);
    });
  });
});
