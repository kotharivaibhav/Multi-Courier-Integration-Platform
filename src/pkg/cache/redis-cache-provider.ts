import pino from 'pino';
import { RedisClient } from '../redis/client';
import { MsgpackSerializer } from '../cache-serializer/msgpack';
import { CacheProvider } from './cache-provider';
import { AppConfig } from '../../config';
import Logger = pino.Logger;

export class RedisCacheProvider implements CacheProvider {
  private readonly redis: RedisClient;
  private readonly logger: Logger;
  private readonly env: string;
  private readonly serializer = new MsgpackSerializer();

  constructor(redis: RedisClient, config: AppConfig, logger: Logger) {
    this.redis = redis;
    this.env = config.service.env;
    this.logger = logger;
  }

  isEnabled(): boolean {
    return true;
  }

  private buildKey(key: string): string {
    return this.env === 'PROD' ? key : `${this.env}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.buildKey(key);
    try {
      const raw = await this.redis.client.getBuffer(cacheKey);
      if (!raw) return null;
      return this.serializer.deserialize<T>(raw);
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Cache get failed');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const cacheKey = this.buildKey(key);
    try {
      const serialized = this.serializer.serialize(value);
      await this.redis.client.setex(cacheKey, ttlSeconds, serialized);
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Cache set failed');
    }
  }

  async del(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);
    try {
      await this.redis.client.del(cacheKey);
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Cache del failed');
    }
  }
}
