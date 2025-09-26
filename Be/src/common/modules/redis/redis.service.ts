import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '../../config';
import { RedisSetOptions, RedisGetResult, RedisKeyValue } from './redis.types';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.getRedisUrl();

    this.client = createClient({
      url: redisUrl,
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

    this.client.connect();
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
    try {
      const result = await this.client.set(key, value, {
        EX: options?.ex,
        NX: options?.nx,
      });
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<RedisGetResult> {
    try {
      const value = await this.client.get(key);
      return {
        value,
        exists: value !== null,
      };
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return {
        value: null,
        exists: false,
      };
    }
  }

  /**
   * Delete key(s)
   */
  async del(key: string | string[]): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key(s):`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL (Time To Live) of key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValues: RedisKeyValue[]): Promise<boolean> {
    try {
      const pairs: string[] = [];
      keyValues.forEach(({ key, value }) => {
        pairs.push(key, value);
      });

      const result = await this.client.mSet(pairs);
      return result === 'OK';
    } catch (error) {
      this.logger.error('Failed to set multiple keys:', error);
      return false;
    }
  }

  /**
   * Get multiple values by keys
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mGet(keys);
    } catch (error) {
      this.logger.error('Failed to get multiple keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Increment a number value
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a number value
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Failed to decrement key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set key with JSON value
   */
  async setJson(
    key: string,
    value: any,
    options?: RedisSetOptions,
  ): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, options);
    } catch (error) {
      this.logger.error(`Failed to set JSON for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get JSON value by key
   */
  async getJson<T = any>(key: string): Promise<RedisGetResult<T>> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get JSON for key ${key}:`, error);
      return {
        value: null,
        exists: false,
      };
    }
  }

  /**
   * Set OTP with expiration
   */
  async setOtp(
    key: string,
    otp: string,
    expiresInSeconds: number = 300,
  ): Promise<boolean> {
    try {
      return await this.set(key, otp, { ex: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Failed to set OTP for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get and delete OTP (one-time use)
   */
  async getAndDeleteOtp(key: string): Promise<string | null> {
    try {
      const result = await this.get(key);
      if (result.exists) {
        await this.del(key);
        return result.value;
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get and delete OTP for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set token with expiration
   */
  async setToken(
    key: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<boolean> {
    try {
      return await this.set(key, token, { ex: expiresInSeconds });
    } catch (error) {
      this.logger.error(`Failed to set token for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get token
   */
  async getToken(key: string): Promise<string | null> {
    try {
      const result = await this.get(key);
      return result.value;
    } catch (error) {
      this.logger.error(`Failed to get token for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete token
   */
  async deleteToken(key: string): Promise<boolean> {
    try {
      const result = await this.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete token for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Failed to ping Redis:', error);
      return 'PONG';
    }
  }

  /**
   * Get Redis info
   */
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error('Failed to get Redis info:', error);
      return '';
    }
  }
}
