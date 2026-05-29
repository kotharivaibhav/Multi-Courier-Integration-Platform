import pino from 'pino';
import { RedisClient } from '../redis/client';
import Redis from 'ioredis';
import { CacheSerializer } from '../cache-serializer/interface';
import { ErrInternalServer } from '../httpresponse/api-errors';
import { AppAPIError } from '../httpresponse/app-api-err';
import { AppConfig } from '../../config';

function buildCacheKeyWithEnv(key: string, env: string): string {
  if (env === 'PROD') {
    return key;
  }
  return `${env}:${key}`;
}

export async function cachedMethodWrapper<T>(
  redisClient: RedisClient,
  logger: pino.Logger,
  key: string,
  expiration: number,
  fn: (...args: unknown[]) => T | Promise<T>,
  serializer: CacheSerializer,
  config: AppConfig,
  ...params: unknown[]
): Promise<T> {
  const cacheKey = buildCacheKeyWithEnv(key, config.service.env);

  try {
    const cachedResult = await getDataFromCache<T>(
      redisClient.client,
      cacheKey,
      serializer,
    );
    if (cachedResult !== null) {
      logger.debug(`Sending cached data for key: ${cacheKey}`);
      return cachedResult;
    }
  } catch (cacheError) {
    logger.error({ error: cacheError }, 'Cache get error');
  }

  try {
    const result = fn(...params);
    const finalResult = result instanceof Promise ? await result : result;

    try {
      await setDataToCache(
        redisClient.client,
        cacheKey,
        expiration,
        finalResult,
        serializer,
      );
      logger.debug(`Data cached successfully for key: ${cacheKey}`);
    } catch (cacheSetError) {
      logger.error({ error: cacheSetError }, 'Error setting data in cache');
    }

    return finalResult;
  } catch (error) {
    if (error instanceof AppAPIError) {
      throw error;
    }
    throw new ErrInternalServer(
      `Err in CachedMethodWrapper. Key: ${cacheKey}, Err: ${error}`,
    );
  }
}

async function setDataToCache<T>(
  redis: Redis,
  key: string,
  expiration: number,
  result: T,
  serializer: CacheSerializer,
): Promise<void> {
  const serialized = serializer.serialize(result);
  await redis.setex(key, expiration, serialized);
}

async function getDataFromCache<T>(
  redis: Redis,
  key: string,
  serializer: CacheSerializer,
): Promise<T | null> {
  const result = serializer.isBinary
    ? await redis.getBuffer(key)
    : await redis.get(key);

  if (result === null) {
    return null;
  }

  return serializer.deserialize<T>(result);
}
