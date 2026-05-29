import pino from 'pino';
import { RedisConfig } from '../../config/schema';
import Redis from 'ioredis';
import Logger = pino.Logger;

export class RedisClient {
  public readonly client: Redis;
  private logger: Logger;

  constructor(config: RedisConfig, logger: Logger) {
    this.logger = logger;

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      db: config.db,
      keepAlive: 30000,
      lazyConnect: true,
      enableOfflineQueue: true,
    });
    this.setupEventHandlers();
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.ping();
      this.logger.info('Redis client connected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to connect to Redis');
      throw new Error(`Redis connection failed: ${error}`);
    }
  }

  public async disconnect(): Promise<void> {
    this.client.disconnect();
    this.logger.info('Redis client disconnected');
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.client.on('ready', () => {
      this.logger.info('Redis ready for commands');
    });

    this.client.on('error', (error) => {
      this.logger.error({ error }, 'Redis error');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis reconnecting');
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });
  }
}
