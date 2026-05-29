export interface CacheSerializer {
  isBinary?: boolean;
  serialize<T>(data: T): string | Buffer;
  deserialize<T>(data: string | Buffer): T;
}
