import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { RedisSetOptions, RedisGetResult, RedisKeyValue } from './redis.types';
import { redisConfig } from '../../config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConf: ConfigType<typeof redisConfig>,
  ) {
    this.client = createClient({
      url: this.redisConf.redisUrl,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    this.client.on('disconnect', () => {
      this.logger.log('Redis Client Disconnected');
    });

    void this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Set a key-value pair
   */
  async set(
    key: string,
    value: string,
    options?: RedisSetOptions,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, {
      EX: options?.ex,
      NX: options?.nx,
    });
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
  async del(key: string | string[]): Promise<number> {
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

    const result = await this.client.mSet(pairs);
    return result === 'OK';
  }

  /**
   * Get multiple values by keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.client.mGet(keys);
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
   * Kiểm tra và xóa OTP cũ trước khi set OTP mới
   */
  async setOtp(
    email: string,
    otp: string,
    expiresInSeconds: number = 300,
    type: 'register' | 'reset_password',
  ): Promise<boolean> {
    const key = `otp:${type}:${email}`;

    // Kiểm tra xem có OTP cũ tồn tại không
    const existingOtp = await this.exists(key);
    if (existingOtp) {
      // Xóa OTP cũ trước khi set OTP mới
      await this.del(key);
      this.logger.log(`Deleted existing OTP for ${email} with type ${type}`);
    }

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
    const result = await this.get(key);
    if (result.exists && result.value) {
      await this.del(key);
      return JSON.parse(result.value);
    }
    return null;
  }

  /**
   * Verify OTP without deleting
   */
  async verifyOtp(
    email: string,
    otp: string,
    type: 'register' | 'reset_password',
  ): Promise<boolean> {
    const key = `otp:${type}:${email}`;
    const result = await this.get(key);
    if (result.exists && result.value) {
      const otpData = JSON.parse(result.value);
      return otpData.otp === otp;
    }
    return false;
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
   * Find all tokens by user ID
   */
  async findAllTokens(userId: number): Promise<string[]> {
    return await this.client.keys(`token:${userId}:*`);
  }

  /**
   * Delete tokens
   */
  async deleteTokens(tokens: string[]): Promise<void> {
    await this.client.del(tokens);
  }
}
