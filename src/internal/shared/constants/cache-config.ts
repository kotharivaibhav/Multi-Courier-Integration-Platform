export interface CacheKeyConfig {
  key: string;
  ttlSeconds: number;
}

export enum CacheKey {
  USER_BY_ID = 'user-by-id',
}

export const CACHE_CONFIG: Record<CacheKey, CacheKeyConfig> = {
  [CacheKey.USER_BY_ID]: {
    key: CacheKey.USER_BY_ID,
    ttlSeconds: 60 * 15,
  },
} as const;
