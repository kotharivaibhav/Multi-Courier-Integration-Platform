import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import { MysqlConfig } from '../../config';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import Logger = pino.Logger;

export class MysqlClient {
  public readonly client: PrismaClient;
  private logger: Logger;
  private config: MysqlConfig;

  constructor(config: MysqlConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    const url = this.buildConnectionUrl(config);
    this.client = new PrismaClient({
      datasources: { db: { url } },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      errorFormat: 'pretty',
    });
  }

  public async createMysqlClient(): Promise<void> {
    try {
      await this.client.$connect();
      await this.client.$queryRaw`SELECT 1 as test`;

      this.logger.info(
        `MySQL client created and validated: ${this.config.db_name}`,
      );
    } catch (exc) {
      let err: Error;
      if (exc instanceof PrismaClientKnownRequestError) {
        err = new Error(
          `Prisma error ${exc.code} for ${this.config.db_name}: ${exc.message}`,
        );
      } else if (exc instanceof PrismaClientInitializationError) {
        err = new Error(
          `Prisma initialization error for ${this.config.db_name}: ${exc.message}`,
        );
      } else {
        err = new Error(
          `Failed to create MySQL client for ${this.config.db_name}`,
        );
      }
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  private buildConnectionUrl(config: MysqlConfig): string {
    const { host, port, username, password, db_name, ...params } = config;

    let url = `mysql://${username}:${password}@${host}:${port}/${db_name}`;

    const searchParams = new URLSearchParams();
    if (params.connectionLimit) {
      searchParams.set('connection_limit', params.connectionLimit.toString());
    }
    if (params.poolTimeout) {
      searchParams.set('pool_timeout', params.poolTimeout.toString());
    }
    if (params.connectTimeout) {
      searchParams.set('connect_timeout', params.connectTimeout.toString());
    }

    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }

    return url;
  }
}

export class ReadOnlyMysqlClient extends MysqlClient {}
