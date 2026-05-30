import { CacheProvider } from './cache-provider';

export class NoOpCacheProvider implements CacheProvider {
  isEnabled(): boolean {
    return false;
  }

  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
    return;
  }

  async del(_key: string): Promise<void> {
    return;
  }
}
