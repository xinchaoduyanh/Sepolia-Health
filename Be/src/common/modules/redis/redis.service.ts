import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { RedisSetOptions, RedisGetResult, RedisKeyValue } from './redis.types';
import IORedis from 'ioredis';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly client: IORedis,
    @Optional()
    @Inject(appConfig.KEY)
    private readonly appConf?: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Set a key-value pair
   */
  async set(
    key: string,
    value: string,
    options?: RedisSetOptions,
  ): Promise<boolean> {
    let result;
    if (options?.ex && options?.nx) {
      result = await this.client.set(key, value, 'EX', options.ex, 'NX');
    } else if (options?.nx) {
      result = await this.client.set(key, value, 'NX');
    } else if (options?.ex) {
      result = await this.client.set(key, value, 'EX', options.ex);
    } else {
      result = await this.client.set(key, value);
    }
    return result === 'OK';
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<RedisGetResult> {
    const value = await this.client.get(key);
    return {
      value,
      exists: value !== null,
    };
  }

  /**
   * Delete key(s)
   */
  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get TTL (Time To Live) of key
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValues: RedisKeyValue[]): Promise<boolean> {
    const pairs: string[] = [];
    keyValues.forEach(({ key, value }) => {
      pairs.push(key, value);
    });

    const result = await this.client.mset(pairs);
    return result === 'OK';
  }

  /**
   * Get multiple values by keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.client.mget(keys);
  }

  /**
   * Increment a number value
   */
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  /**
   * Decrement a number value
   */
  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  /**
   * Set key with JSON value
   */
  async setJson(
    key: string,
    value: any,
    options?: RedisSetOptions,
  ): Promise<boolean> {
    const jsonString = JSON.stringify(value);
    return await this.set(key, jsonString, options);
  }

  /**
   * Get JSON value by key
   */
  async getJson<T = any>(key: string): Promise<RedisGetResult<T>> {
    const result = await this.get(key);
    if (result.value) {
      const parsed = JSON.parse(result.value) as T;
      return {
        value: parsed,
        exists: true,
      };
    }
    return {
      value: null,
      exists: false,
    };
  }

  /**
   * Set OTP with expiration
   * Kiểm tra và xóa OTP cũ trước khi set OTP mới, đồng thời reset bộ đếm lần sai
   */
  async setOtp(
    email: string,
    otp: string,
    expiresInSeconds: number = 300,
    type: 'register' | 'reset_password',
  ): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const attemptsKey = `otp_attempts:${type}:${email}`;

    // Kiểm tra xem có OTP cũ tồn tại không
    const existingOtp = await this.exists(key);
    if (existingOtp) {
      // Xóa OTP cũ trước khi set OTP mới
      await this.del(key);
      this.logger.log(`Deleted existing OTP for ${email} with type ${type}`);
    }

    // Reset bộ đếm số lần nhập sai khi gửi OTP mới
    await this.del(attemptsKey);

    const value = JSON.stringify({
      email,
      otp,
      type,
      createdAt: new Date().toISOString(),
    });

    const result = await this.set(key, value, { ex: expiresInSeconds });
    if (result) {
      this.logger.log(
        `Set new OTP for ${email} with type ${type}, expires in ${expiresInSeconds}s`,
      );
    }

    return result;
  }

  /**
   * Get and delete OTP (one-time use)
   */
  async getAndDeleteOtp(
    email: string,
    type: 'register' | 'reset_password',
  ): Promise<{
    email: string;
    otp: string;
    type: string;
    createdAt: string;
  } | null> {
    const key = `otp:${type}:${email}`;
    const attemptsKey = `otp_attempts:${type}:${email}`;
    const result = await this.get(key);
    if (result.exists && result.value) {
      await this.del(key);
      await this.del(attemptsKey);
      return JSON.parse(result.value);
    }
    return null;
  }

  /**
   * Verify OTP without deleting
   * Giới hạn tối đa 5 lần nhập sai
   */
  async verifyOtp(
    email: string,
    otp: string,
    type: 'register' | 'reset_password',
  ): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const attemptsKey = `otp_attempts:${type}:${email}`;

    const result = await this.get(key);
    if (!result.exists || !result.value) {
      return false;
    }

    const otpData = JSON.parse(result.value);
    if (otpData.otp === otp) {
      return true;
    }

    // Khi sai thì tăng bộ đếm otp_attempts:{type}:{email}
    const attempts = await this.incr(attemptsKey);
    const remainingTtl = await this.ttl(key);
    const ttlToSet = remainingTtl > 60 ? remainingTtl : 60;
    await this.expire(attemptsKey, ttlToSet);

    if (attempts >= 5) {
      // Đạt 5 lần sai thì xoá OTP + bộ đếm và trả false
      await this.del(key);
      await this.del(attemptsKey);
      this.logger.warn(
        `OTP của ${email} (${type}) đã bị xoá do nhập sai quá 5 lần`,
      );
    }

    return false;
  }

  /**
   * Check and set OTP cooldown (60 seconds)
   * Returns true if cooldown was successfully acquired (can send OTP)
   * Returns false if still in cooldown (cannot send OTP)
   */
  async checkAndSetOtpCooldown(
    email: string,
    type: 'register' | 'reset_password',
    cooldownSeconds: number = 60,
  ): Promise<boolean> {
    const key = `otp_cooldown:${type}:${email}`;
    return await this.set(key, '1', { ex: cooldownSeconds, nx: true });
  }

  /**
   * Check if OTP exists for email and type
   */
  async hasOtp(
    email: string,
    type: 'register' | 'reset_password',
  ): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    return await this.exists(key);
  }

  /**
   * Set token with expiration
   */
  async setToken(
    key: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<boolean> {
    return await this.set(key, token, { ex: expiresInSeconds });
  }

  /**
   * Get token
   */
  async getToken(key: string): Promise<string | null> {
    const result = await this.get(key);
    return result.value;
  }

  /**
   * Delete token
   */
  async deleteToken(key: string): Promise<boolean> {
    const result = await this.del(key);
    return result > 0;
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  /**
   * Get Redis info
   */
  async info(): Promise<string> {
    return await this.client.info();
  }

  /**
   * Set token revocation timestamp for user (revoke all tokens issued before this timestamp)
   * Key format: auth:revoked_before:{userId}
   * TTL: refreshTokenExpiresIn (seconds)
   */
  async setTokensRevokedBefore(
    userId: number,
    ms: number,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const key = `auth:revoked_before:${userId}`;
    const ttl = ttlSeconds ?? this.appConf?.refreshTokenExpiresIn ?? 604800;
    return await this.set(key, ms.toString(), { ex: ttl });
  }

  /**
   * Get token revocation timestamp for user
   */
  async getTokensRevokedBefore(userId: number): Promise<number | null> {
    const key = `auth:revoked_before:${userId}`;
    const result = await this.get(key);
    if (result.exists && result.value) {
      const parsed = Number(result.value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * ==================== PAYMENT CODE METHODS ====================
   */

  /**
   * Set payment code with billing data and auto-expiration (15 minutes)
   * Key format: payment_code:{code}
   * Index format: payment_code_by_appointment:{appointmentId} -> {code}
   * Value: JSON with billingId, appointmentId, amount, createdAt, expiresAt
   */
  async setPaymentCode(
    code: string,
    data: {
      billingId: number;
      appointmentId: number;
      amount: number;
    },
    expiresInSeconds: number = 900, // 15 minutes default
  ): Promise<boolean> {
    const key = `payment_code:${code}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    const value = JSON.stringify({
      billingId: data.billingId,
      appointmentId: data.appointmentId,
      amount: data.amount,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
    });

    const result = await this.set(key, value, { ex: expiresInSeconds });
    if (result) {
      // Lưu thêm index payment_code_by_appointment:{appointmentId} -> code (cùng TTL)
      const indexKey = `payment_code_by_appointment:${data.appointmentId}`;
      await this.set(indexKey, code, { ex: expiresInSeconds });

      this.logger.log(
        `Created payment code ${code} for appointment ${data.appointmentId}, expires in ${expiresInSeconds}s`,
      );
    }

    return result;
  }

  /**
   * Get payment code data
   */
  async getPaymentCode(code: string): Promise<{
    billingId: number;
    appointmentId: number;
    amount: number;
    createdAt: string;
    expiresAt: string;
    isUsed: boolean;
  } | null> {
    const key = `payment_code:${code}`;
    const result = await this.get(key);

    if (result.exists && result.value) {
      return JSON.parse(result.value);
    }

    return null;
  }

  /**
   * Mark payment code as used
   */
  async markPaymentCodeAsUsed(code: string): Promise<boolean> {
    const key = `payment_code:${code}`;
    const paymentData = await this.getPaymentCode(code);

    if (!paymentData) {
      return false;
    }

    // Update isUsed flag
    paymentData.isUsed = true;

    // Get remaining TTL to preserve expiration
    const ttl = await this.ttl(key);
    if (ttl <= 0) {
      return false; // Already expired
    }

    const result = await this.set(key, JSON.stringify(paymentData), {
      ex: ttl,
    });

    if (result) {
      this.logger.log(`Marked payment code ${code} as used`);
    }

    return result;
  }

  /**
   * Cancel/Delete payment code
   */
  async cancelPaymentCode(code: string): Promise<boolean> {
    const key = `payment_code:${code}`;
    const paymentData = await this.getPaymentCode(code);
    const result = await this.del(key);

    if (result > 0) {
      if (paymentData?.appointmentId) {
        await this.del(
          `payment_code_by_appointment:${paymentData.appointmentId}`,
        );
      }
      this.logger.log(`Cancelled payment code ${code}`);
      return true;
    }

    return false;
  }

  /**
   * Check if payment code exists and is valid (not used, not expired)
   */
  async isPaymentCodeValid(code: string): Promise<boolean> {
    const paymentData = await this.getPaymentCode(code);

    if (!paymentData) {
      return false;
    }

    if (paymentData.isUsed) {
      return false;
    }

    // Check if expired (with grace period of 5 minutes)
    const now = new Date();
    const expiresAt = new Date(paymentData.expiresAt);
    const gracePeriod = 5 * 60 * 1000; // 5 minutes

    if (now.getTime() > expiresAt.getTime() + gracePeriod) {
      return false;
    }

    return true;
  }

  /**
   * Get payment code by appointment ID (if exists)
   * Sử dụng index payment_code_by_appointment trước; fallback dùng SCAN với MATCH, COUNT 100
   */
  async getPaymentCodeByAppointmentId(
    appointmentId: number,
  ): Promise<string | null> {
    // 1. Đọc index trước
    const indexKey = `payment_code_by_appointment:${appointmentId}`;
    const indexResult = await this.get(indexKey);

    if (indexResult.exists && indexResult.value) {
      const code = indexResult.value;
      const codeKey = `payment_code:${code}`;
      const codeExists = await this.exists(codeKey);
      if (codeExists) {
        return code;
      } else {
        // Dọn dẹp index nếu key chính đã hết hạn hoặc bị xóa
        await this.del(indexKey);
      }
    }

    // 2. Fallback: dùng vòng lặp SCAN thay cho lệnh KEYS
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        'payment_code:*',
        'COUNT',
        100,
      );
      cursor = nextCursor;

      for (const key of keys) {
        if (key.startsWith('payment_code_by_appointment:')) {
          continue;
        }

        const data = await this.get(key);
        if (data.exists && data.value) {
          try {
            const paymentData = JSON.parse(data.value);
            if (paymentData.appointmentId === appointmentId) {
              const code = key.replace('payment_code:', '');
              // Tái tạo lại index nếu còn TTL
              const ttl = await this.ttl(key);
              if (ttl > 0) {
                await this.set(indexKey, code, { ex: ttl });
              }
              return code;
            }
          } catch {
            // Bỏ qua lỗi parse JSON
          }
        }
      }
    } while (cursor !== '0');

    return null;
  }
}
