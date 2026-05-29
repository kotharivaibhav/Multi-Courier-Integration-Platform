import { UserService } from './user';
import { UserRepository } from '../repository/user';
import { UserReadRepository } from '../repository/user-read';
import { RedisClient } from '../../../pkg/redis/client';
import pino from 'pino';
import { AppConfig } from '../../../config';
import {
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
  UserListResponseDto,
  UserResponseDto,
} from '../dto/user';
import { transformUserToResponse } from '../transformers/user';
import {
  ErrConflict,
  ErrNotFound,
} from '../../../pkg/httpresponse/api-errors';
import { USER_DEFAULTS, USER_MESSAGES } from '../constants/user';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cachedMethodWrapper } from '../../../pkg/cache-wrapper/wrapper';
import { MsgpackSerializer } from '../../../pkg/cache-serializer/msgpack';
import {
  CACHE_CONFIG,
  CacheKey,
} from '../../shared/constants/cache-config';
import {
  isRecordNotFound,
  isUniqueConstraintFailed,
} from '../../../pkg/prisma/errors';
import Logger = pino.Logger;

export class UserServiceImpl implements UserService {
  private readonly userRepo: UserRepository;
  private readonly userReadRepo: UserReadRepository;
  private readonly redisClient: RedisClient;
  private readonly logger: Logger;
  private readonly config: AppConfig;

  constructor(
    userRepo: UserRepository,
    userReadRepo: UserReadRepository,
    redisClient: RedisClient,
    logger: Logger,
    config: AppConfig,
  ) {
    this.userRepo = userRepo;
    this.userReadRepo = userReadRepo;
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  async createUser(input: CreateUserInput): Promise<UserResponseDto> {
    const [existingEmail, existingMobile] = await Promise.all([
      this.userReadRepo.findUserByEmail(input.email),
      this.userReadRepo.findUserByMobile(input.mobileNumber),
    ]);

    if (existingEmail) {
      throw new ErrConflict(USER_MESSAGES.EMAIL_EXISTS);
    }
    if (existingMobile) {
      throw new ErrConflict(USER_MESSAGES.MOBILE_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(
      input.password,
      USER_DEFAULTS.BCRYPT_SALT_ROUNDS,
    );

    try {
      const user = await this.userRepo.createUser({
        name: input.name,
        email: input.email.toLowerCase(),
        password: hashedPassword,
        mobileNumber: input.mobileNumber,
        status: input.status ?? UserStatus.ACTIVE,
      });

      return transformUserToResponse(user);
    } catch (error) {
      if (isUniqueConstraintFailed(error)) {
        throw new ErrConflict(USER_MESSAGES.EMAIL_EXISTS);
      }
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    const cacheConfig = CACHE_CONFIG[CacheKey.USER_BY_ID];
    const cacheKey = `${cacheConfig.key}:${id}`;

    try {
      const user = await cachedMethodWrapper(
        this.redisClient,
        this.logger,
        cacheKey,
        cacheConfig.ttlSeconds,
        () => this.fetchUserOrThrow(id),
        new MsgpackSerializer(),
        this.config,
      );
      return transformUserToResponse(user);
    } catch (error) {
      if (error instanceof ErrNotFound) {
        throw error;
      }
      throw error;
    }
  }

  private async fetchUserOrThrow(id: number) {
    try {
      return await this.userReadRepo.getUserById(id);
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new ErrNotFound(USER_MESSAGES.NOT_FOUND);
      }
      throw error;
    }
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<UserResponseDto> {
    await this.fetchUserOrThrow(id);

    if (input.email) {
      const existing = await this.userReadRepo.findUserByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ErrConflict(USER_MESSAGES.EMAIL_EXISTS);
      }
    }

    if (input.mobileNumber) {
      const existing = await this.userReadRepo.findUserByMobile(input.mobileNumber);
      if (existing && existing.id !== id) {
        throw new ErrConflict(USER_MESSAGES.MOBILE_EXISTS);
      }
    }

    const updateData: UpdateUserInput & { password?: string } = { ...input };
    if (input.email) {
      updateData.email = input.email.toLowerCase();
    }
    if (input.password) {
      updateData.password = await bcrypt.hash(
        input.password,
        USER_DEFAULTS.BCRYPT_SALT_ROUNDS,
      );
    }

    const updated = await this.userRepo.updateUserById(id, updateData);
    if (!updated) {
      throw new ErrNotFound(USER_MESSAGES.NOT_FOUND);
    }

    await this.invalidateUserCache(id);
    return transformUserToResponse(updated);
  }

  async softDeleteUser(id: number): Promise<void> {
    await this.fetchUserOrThrow(id);
    await this.userRepo.softDeleteUserById(id);
    await this.invalidateUserCache(id);
  }

  async listUsers(input: ListUsersInput): Promise<UserListResponseDto> {
    const { users, total } = await this.userReadRepo.listUsers(input);

    return {
      users: users.map(transformUserToResponse),
      total,
      page: input.page,
      limit: input.limit,
    };
  }

  private async invalidateUserCache(id: number): Promise<void> {
    const cacheConfig = CACHE_CONFIG[CacheKey.USER_BY_ID];
    const cacheKey =
      this.config.service.env === 'PROD'
        ? `${cacheConfig.key}:${id}`
        : `${this.config.service.env}:${cacheConfig.key}:${id}`;

    try {
      await this.redisClient.client.del(cacheKey);
    } catch (error) {
      this.logger.warn({ error, cacheKey }, 'Failed to invalidate user cache');
    }
  }
}
