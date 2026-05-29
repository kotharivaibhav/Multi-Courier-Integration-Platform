import { AppConfig } from '../config';
import pino from 'pino';
import { MysqlClient, ReadOnlyMysqlClient } from '../pkg/mysql/client';
import { RedisClient } from '../pkg/redis/client';
import { UserController } from '../internal/user/controller/user';
import { UserControllerImpl } from '../internal/user/controller/user-impl';
import { UserReadRepository } from '../internal/user/repository/user-read';
import { UserReadRepositoryImpl } from '../internal/user/repository/user-read-impl';
import { UserRepository } from '../internal/user/repository/user';
import { UserRepositoryImpl } from '../internal/user/repository/user-impl';
import { UserService } from '../internal/user/service/user';
import { UserServiceImpl } from '../internal/user/service/user-impl';
import Logger = pino.Logger;

export class AppContext {
  public readonly config: AppConfig;
  public readonly logger: Logger;
  public primaryMysqlDB!: MysqlClient;
  public replicaMysqlDB!: ReadOnlyMysqlClient;
  public redisClient!: RedisClient;
  public userController!: UserController;
  public userService!: UserService;

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

  public setRedisClient(client: RedisClient): void {
    this.redisClient = client;
  }

  public setUserService(userService: UserService): void {
    this.userService = userService;
  }

  public initUserController(userService: UserService): void {
    this.userController = new UserControllerImpl(userService);
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
    redisClient: RedisClient,
  ): UserService {
    return new UserServiceImpl(
      userRepo,
      userReadOnlyRepo,
      redisClient,
      this.logger,
      this.config,
    );
  }
}
