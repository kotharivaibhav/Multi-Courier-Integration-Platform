import { AppContext } from './app-context';
import { loadConfig, MysqlConfig } from '../config';
import { initLogger } from '../pkg/logger/factory';
import { MysqlClient, ReadOnlyMysqlClient } from '../pkg/mysql/client';
import pino from 'pino';
import { RedisClient } from '../pkg/redis/client';
import { RedisConfig } from '../config/schema';
import { NoOpCacheProvider } from '../pkg/cache/noop-cache-provider';
import { RedisCacheProvider } from '../pkg/cache/redis-cache-provider';
import { CourierAdapterFactory } from '../external/courier/factory/courier-adapter-factory';

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

    await this.initCache();

    const courierFactory = new CourierAdapterFactory(
      this.context.buildCourierAdapters(),
    );
    this.context.setCourierAdapterFactory(courierFactory);

    await this.seedCourierPartners(primaryDb);

    const userReadPrimaryRepo = this.context.getUserReadRepository(primaryDb);
    const userRepo = this.context.getUserRepository(
      userReadPrimaryRepo,
      primaryDb,
    );
    const userReadReplicaRepo = this.context.getUserReadRepository(replicaDb);

    const userService = this.context.getUserService(
      userRepo,
      userReadReplicaRepo,
    );
    this.context.setUserService(userService);
    this.context.initUserController(userService);

    const shipmentReadPrimaryRepo =
      this.context.getShipmentReadRepository(primaryDb);
    const shipmentRepo = this.context.getShipmentRepository(
      shipmentReadPrimaryRepo,
      primaryDb,
    );
    const shipmentReadReplicaRepo =
      this.context.getShipmentReadRepository(replicaDb);

    const shipmentService = this.context.getShipmentService(
      shipmentRepo,
      shipmentReadReplicaRepo,
      courierFactory,
    );
    this.context.setShipmentService(shipmentService);
    this.context.initShipmentController(shipmentService);
  }

  private async initCache(): Promise<void> {
    if (!this.context.config.cache.enabled) {
      this.context.logger.info('Cache disabled — running without Redis');
      this.context.setCacheProvider(new NoOpCacheProvider());
      return;
    }

    try {
      const redisClient = await this.createRedisClient(
        this.context.config.redis,
        this.context.logger,
      );
      this.context.setRedisClient(redisClient);
      this.context.setCacheProvider(
        new RedisCacheProvider(
          redisClient,
          this.context.config,
          this.context.logger,
        ),
      );
    } catch (error) {
      this.context.logger.warn(
        { error },
        'Redis unavailable — falling back to no-op cache',
      );
      this.context.setRedisClient(null);
      this.context.setCacheProvider(new NoOpCacheProvider());
    }
  }

  private async seedCourierPartners(db: MysqlClient): Promise<void> {
    const partners = [
      { code: 'urbanebolt', name: 'UrbaneBolt' },
      { code: 'mock', name: 'Mock Courier' },
    ];

    for (const partner of partners) {
      await db.client.courierPartner.upsert({
        where: { code: partner.code },
        create: partner,
        update: { name: partner.name, isActive: true },
      });
    }
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
