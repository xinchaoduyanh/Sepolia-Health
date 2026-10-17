import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { RedisService } from '../redis/redis.service';
import { TokenPayload } from './jwt.types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockRedisService: { getTokensRevokedBefore: jest.Mock };
  const mockJwtConf = {
    secret: 'test-jwt-secret-key-1234567890',
  } as any;

  beforeEach(() => {
    mockRedisService = {
      getTokensRevokedBefore: jest.fn(),
    };

    strategy = new JwtStrategy(mockJwtConf, mockRedisService as unknown as RedisService);
  });

  it('token có iatMs < revokedBefore → UnauthorizedException', async () => {
    const revokedBefore = 1700000500000;
    mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBefore);

    const payload: TokenPayload = {
      userId: 1,
      role: 'PATIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(revokedBefore / 1000) - 10,
      iatMs: revokedBefore - 5000, // nhỏ hơn mốc revokedBefore
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockRedisService.getTokensRevokedBefore).toHaveBeenCalledWith(1);
  });

  it('token có iatMs >= revokedBefore → trả payload', async () => {
    const revokedBefore = 1700000500000;
    mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBefore);

    const payload: TokenPayload = {
      userId: 1,
      role: 'PATIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(revokedBefore / 1000) + 1,
      iatMs: revokedBefore + 1000, // lớn hơn hoặc bằng mốc revokedBefore
    };

    const result = await strategy.validate(payload);
    expect(result).toEqual(payload);
  });

  it('không có mốc revokedBefore → trả payload', async () => {
    mockRedisService.getTokensRevokedBefore.mockResolvedValue(null);

    const payload: TokenPayload = {
      userId: 1,
      role: 'PATIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iatMs: Date.now(),
    };

    const result = await strategy.validate(payload);
    expect(result).toEqual(payload);
  });

  it('token cũ chỉ có iat (giây) được so đúng', async () => {
    const iatSeconds = 1700000000;
    const revokedBeforeLater = 1700000001000; // sau iat * 1000
    mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBeforeLater);

    const legacyPayloadOld: TokenPayload = {
      userId: 2,
      role: 'DOCTOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: iatSeconds, // iat * 1000 = 1700000000000 < 1700000001000
    };

    await expect(strategy.validate(legacyPayloadOld)).rejects.toThrow(
      UnauthorizedException,
    );

    const revokedBeforeEarlier = 1699999999000; // trước iat * 1000
    mockRedisService.getTokensRevokedBefore.mockResolvedValue(revokedBeforeEarlier);

    const legacyPayloadValid: TokenPayload = {
      userId: 2,
      role: 'DOCTOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: iatSeconds, // iat * 1000 = 1700000000000 >= 1699999999000
    };

    const result = await strategy.validate(legacyPayloadValid);
    expect(result).toEqual(legacyPayloadValid);
  });
});
