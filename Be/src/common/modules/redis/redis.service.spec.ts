import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let store: Map<string, string>;
  let attemptsCount: number;
  let mockClient: any;

  beforeEach(() => {
    store = new Map<string, string>();
    attemptsCount = 0;

    mockClient = {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, val: string) => {
        store.set(key, val);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        const deleted = store.delete(key);
        return deleted ? 1 : 0;
      }),
      exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
      incr: jest.fn(async (key: string) => {
        attemptsCount++;
        store.set(key, attemptsCount.toString());
        return attemptsCount;
      }),
      ttl: jest.fn(async () => 300),
      expire: jest.fn(async () => 1),
    };

    service = new RedisService(mockClient);
  });

  describe('verifyOtp', () => {
    it('đúng thì trả true và không tăng bộ đếm', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      store.set(
        `otp:register:${email}`,
        JSON.stringify({ email, otp, type: 'register' }),
      );

      const result = await service.verifyOtp(email, otp, 'register');
      expect(result).toBe(true);
      expect(mockClient.incr).not.toHaveBeenCalled();
    });

    it('sai 5 lần thì OTP bị xoá và lần đúng sau đó trả false', async () => {
      const email = 'victim@example.com';
      const correctOtp = '654321';
      const wrongOtp = '000000';

      store.set(
        `otp:register:${email}`,
        JSON.stringify({ email, otp: correctOtp, type: 'register' }),
      );

      // Sai 4 lần đầu
      for (let i = 1; i <= 4; i++) {
        const res = await service.verifyOtp(email, wrongOtp, 'register');
        expect(res).toBe(false);
        expect(store.has(`otp:register:${email}`)).toBe(true);
      }

      // Lần sai thứ 5
      const fifthRes = await service.verifyOtp(email, wrongOtp, 'register');
      expect(fifthRes).toBe(false);

      // OTP đã bị xóa khỏi redis
      expect(store.has(`otp:register:${email}`)).toBe(false);
      expect(mockClient.del).toHaveBeenCalledWith(`otp:register:${email}`);
      expect(mockClient.del).toHaveBeenCalledWith(
        `otp_attempts:register:${email}`,
      );

      // Lần đúng sau đó vẫn phải trả false vì OTP đã bị xóa
      const subsequentCorrectRes = await service.verifyOtp(
        email,
        correctOtp,
        'register',
      );
      expect(subsequentCorrectRes).toBe(false);
    });
  });

  describe('token revocation', () => {
    it('setTokensRevokedBefore và getTokensRevokedBefore hoạt động đúng', async () => {
      const userId = 99;
      const now = Date.now();

      await service.setTokensRevokedBefore(userId, now);
      expect(mockClient.set).toHaveBeenCalled();

      const revokedBefore = await service.getTokensRevokedBefore(userId);
      expect(revokedBefore).toBe(now);
    });
  });

  describe('checkAndSetOtpCooldown', () => {
    it('gọi set với NX và EX 60', async () => {
      const email = 'cooldown@example.com';
      mockClient.set = jest.fn().mockResolvedValue('OK');

      const result = await service.checkAndSetOtpCooldown(email, 'register');
      expect(result).toBe(true);
      expect(mockClient.set).toHaveBeenCalledWith(
        'otp_cooldown:register:cooldown@example.com',
        '1',
        'EX',
        60,
        'NX',
      );
    });
  });
});
