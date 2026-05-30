import { AppConfig } from '../config';
import pino from 'pino';
import { MysqlClient, ReadOnlyMysqlClient } from '../pkg/mysql/client';
import { RedisClient } from '../pkg/redis/client';
import { CacheProvider } from '../pkg/cache/cache-provider';
import { UserController } from '../internal/user/controller/user';
import { UserControllerImpl } from '../internal/user/controller/user-impl';
import { UserReadRepository } from '../internal/user/repository/user-read';
import { UserReadRepositoryImpl } from '../internal/user/repository/user-read-impl';
import { UserRepository } from '../internal/user/repository/user';
import { UserRepositoryImpl } from '../internal/user/repository/user-impl';
import { UserService } from '../internal/user/service/user';
import { UserServiceImpl } from '../internal/user/service/user-impl';
import { ShipmentController } from '../internal/shipment/controller/shipment';
import { ShipmentControllerImpl } from '../internal/shipment/controller/shipment-impl';
import { ShipmentReadRepository } from '../internal/shipment/repository/shipment-read';
import { ShipmentReadRepositoryImpl } from '../internal/shipment/repository/shipment-read-impl';
import { ShipmentRepository } from '../internal/shipment/repository/shipment';
import { ShipmentRepositoryImpl } from '../internal/shipment/repository/shipment-impl';
import { ShipmentService } from '../internal/shipment/service/shipment';
import { ShipmentServiceImpl } from '../internal/shipment/service/shipment-impl';
import { CourierAdapterFactory } from '../external/courier/factory/courier-adapter-factory';
import { CourierAdapter } from '../external/courier/adapter/courier-adapter';
import { UrbaneBoltAdapter } from '../external/urbanebolt/service/urbanebolt-adapter';
import { MockCourierAdapter } from '../external/mock-courier/service/mock-courier-adapter';
import Logger = pino.Logger;

export class AppContext {
  public readonly config: AppConfig;
  public readonly logger: Logger;
  public primaryMysqlDB!: MysqlClient;
  public replicaMysqlDB!: ReadOnlyMysqlClient;
  public redisClient: RedisClient | null = null;
  public cacheProvider!: CacheProvider;
  public courierAdapterFactory!: CourierAdapterFactory;
  public userController!: UserController;
  public userService!: UserService;
  public shipmentController!: ShipmentController;
  public shipmentService!: ShipmentService;

  constructor(config: AppConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  public setPrimaryMysqlDB(db: MysqlClient): void {
    this.primaryMysqlDB = db;
  }

  public setReplicaMysqlDB(db: MysqlClient): void {
    this.replicaMysqlDB = db as ReadOnlyMysqlClient;
  }

  public setRedisClient(client: RedisClient | null): void {
    this.redisClient = client;
  }

  public setCacheProvider(provider: CacheProvider): void {
    this.cacheProvider = provider;
  }

  public setCourierAdapterFactory(factory: CourierAdapterFactory): void {
    this.courierAdapterFactory = factory;
  }

  public setUserService(userService: UserService): void {
    this.userService = userService;
  }

  public setShipmentService(shipmentService: ShipmentService): void {
    this.shipmentService = shipmentService;
  }

  public initUserController(userService: UserService): void {
    this.userController = new UserControllerImpl(userService);
  }

  public initShipmentController(shipmentService: ShipmentService): void {
    this.shipmentController = new ShipmentControllerImpl(shipmentService);
  }

  public getUserReadRepository(
    db: MysqlClient | ReadOnlyMysqlClient,
  ): UserReadRepository {
    return new UserReadRepositoryImpl(db);
  }

  public getUserRepository(
    readRepo: UserReadRepository,
    db: MysqlClient,
  ): UserRepository {
    return new UserRepositoryImpl(readRepo, db);
  }

  public getUserService(
    userRepo: UserRepository,
    userReadOnlyRepo: UserReadRepository,
  ): UserService {
    return new UserServiceImpl(
      userRepo,
      userReadOnlyRepo,
      this.config,
      this.logger,
    );
  }

  public getShipmentReadRepository(
    db: MysqlClient | ReadOnlyMysqlClient,
  ): ShipmentReadRepository {
    return new ShipmentReadRepositoryImpl(db);
  }

  public getShipmentRepository(
    readRepo: ShipmentReadRepository,
    db: MysqlClient,
  ): ShipmentRepository {
    return new ShipmentRepositoryImpl(readRepo, db);
  }

  public getShipmentService(
    shipmentRepo: ShipmentRepository,
    shipmentReadRepo: ShipmentReadRepository,
    courierFactory: CourierAdapterFactory,
  ): ShipmentService {
    return new ShipmentServiceImpl(
      shipmentRepo,
      shipmentReadRepo,
      courierFactory,
      this.logger,
      this.config,
    );
  }

  public buildCourierAdapters(): CourierAdapter[] {
    const adapters: CourierAdapter[] = [];

    if (this.config.couriers.mock.enabled) {
      adapters.push(new MockCourierAdapter(this.config.couriers.mock));
    }

    if (this.config.couriers.urbanebolt.enabled) {
      adapters.push(
        new UrbaneBoltAdapter(this.config.couriers.urbanebolt, this.logger),
      );
    }

    return adapters;
  }
}
