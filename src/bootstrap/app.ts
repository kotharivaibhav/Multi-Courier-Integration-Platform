import { AppContext } from './app-context';
import { loadConfig, MysqlConfig } from '../config';
import { initLogger } from '../pkg/logger/factory';
import { MysqlClient, ReadOnlyMysqlClient } from '../pkg/mysql/client';
import pino from 'pino';
import { RedisClient } from '../pkg/redis/client';
import { RedisConfig } from '../config/schema';

export class App {
  private context: AppContext;

  constructor() {
    const config = loadConfig();
    const logger = initLogger(config);
    this.context = new AppContext(config, logger);
  }

  public async init(): Promise<void> {
    let primaryDb: MysqlClient;
    let replicaDb: MysqlClient;
    let redisClient: RedisClient;

    try {
      primaryDb = await this.createMysqlDependency(
        this.context.config.mysql.primary,
        this.context.logger,
        false,
      );
    } catch (error) {
      this.context.logger.error(
        'Critical failure: Primary database connection failed',
      );
      throw error;
    }

    try {
      replicaDb = await this.createMysqlDependency(
        this.context.config.mysql.replica,
        this.context.logger,
        true,
      );
    } catch (error) {
      this.context.logger.warn(
        { error: error instanceof Error ? error.message : error },
        'Replica database connection failed - using primary for reads',
      );
      replicaDb = primaryDb;
    }

    this.context.setPrimaryMysqlDB(primaryDb);
    this.context.setReplicaMysqlDB(replicaDb);

    try {
      redisClient = await this.createRedisClient(
        this.context.config.redis,
        this.context.logger,
      );
    } catch (error) {
      this.context.logger.error(error, 'Critical failure: Redis connection failed');
      throw error;
    }

    this.context.setRedisClient(redisClient);

    const userReadPrimaryRepo = this.context.getUserReadRepository(primaryDb);
    const userRepo = this.context.getUserRepository(userReadPrimaryRepo, primaryDb);
    const userReadReplicaRepo = this.context.getUserReadRepository(replicaDb);

    const userService = this.context.getUserService(
      userRepo,
      userReadReplicaRepo,
      redisClient,
    );
    this.context.setUserService(userService);
    this.context.initUserController(userService);
  }

  public async runHttpServer(): Promise<void> {
    const { runHttpServer } = await import('../server');
    await runHttpServer(this, this.context);
  }

  public async shutdown(): Promise<void> {
    if (this.context) {
      await Promise.allSettled([
        this.context.primaryMysqlDB.disconnect(),
        this.context.replicaMysqlDB.disconnect(),
        this.context.redisClient?.disconnect(),
      ]);
    }
  }

  public getContext(): AppContext {
    return this.context;
  }

  private async createMysqlDependency(
    config: MysqlConfig,
    logger: pino.Logger,
    isReadOnly: boolean,
  ): Promise<MysqlClient> {
    const client = this.getMysqlClient(config, logger, isReadOnly);
    await client.createMysqlClient();
    return client;
  }

  private async createRedisClient(
    config: RedisConfig,
    logger: pino.Logger,
  ): Promise<RedisClient> {
    const client = new RedisClient(config, logger);
    await client.connect();
    return client;
  }

  private getMysqlClient(
    config: MysqlConfig,
    logger: pino.Logger,
    isReadOnly: boolean,
  ): MysqlClient {
    if (isReadOnly) {
      return new ReadOnlyMysqlClient(config, logger);
    }
    return new MysqlClient(config, logger);
  }
}

export function newApp(): App {
  return new App();
}
