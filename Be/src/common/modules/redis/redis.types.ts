export interface RedisConfig {
  url: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export interface RedisSetOptions {
  ex?: number; // Expire in seconds
  px?: number; // Expire in milliseconds
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

export interface RedisGetResult<T = string> {
  value: T | null;
  exists: boolean;
}

export interface RedisKeyValue {
  key: string;
  value: string;
  ttl?: number;
}

export const REDIS_CLIENT = 'REDIS_CLIENT';