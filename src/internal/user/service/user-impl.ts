import { UserService } from './user';
import { UserRepository } from '../repository/user';
import { UserReadRepository } from '../repository/user-read';
import { AppConfig } from '../../../config';
import pino from 'pino';
import bcrypt from 'bcryptjs';
import {
  CreateUserInput,
  ListUsersInput,
  LoginInput,
  LoginResponseDto,
  UpdateUserInput,
  UserListResponseDto,
  UserResponseDto,
} from '../dto/user';
import { transformUserToResponse } from '../transformers/user';
import {
  ErrEmailExists,
  ErrInvalidCredentials,
  ErrMobileExists,
  ErrUserNotFound,
} from '../../../pkg/httpresponse/api-errors';
import {
  isRecordNotFound,
  isUniqueConstraintFailed,
} from '../../../pkg/prisma/errors';
import { UserStatus } from '@prisma/client';
import { signAdminToken } from '../../../pkg/jwt/token';
import Logger = pino.Logger;

export class UserServiceImpl implements UserService {
  private readonly userRepo: UserRepository;
  private readonly userReadRepo: UserReadRepository;
  private readonly config: AppConfig;
  private readonly logger: Logger;

  constructor(
    userRepo: UserRepository,
    userReadRepo: UserReadRepository,
    config: AppConfig,
    logger: Logger,
  ) {
    this.userRepo = userRepo;
    this.userReadRepo = userReadRepo;
    this.config = config;
    this.logger = logger;
  }

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const user = await this.userReadRepo.findUserByEmail(input.email);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ErrInvalidCredentials();
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      throw new ErrInvalidCredentials();
    }

    const profile = transformUserToResponse(user);
    const token = signAdminToken(
      { userId: user.id, email: user.email },
      this.config.auth.jwtSecret,
      this.config.auth.jwtExpiresInHours,
    );

    return { token, user: profile };
  }

  async getActiveUserById(id: number): Promise<UserResponseDto> {
    return this.getUserById(id);
  }

  async createUser(input: CreateUserInput): Promise<UserResponseDto> {
    const [existingEmail, existingMobile] = await Promise.all([
      this.userReadRepo.findUserByEmail(input.email),
      this.userReadRepo.findUserByMobile(input.mobileNumber),
    ]);

    if (existingEmail) {
      throw new ErrEmailExists();
    }
    if (existingMobile) {
      throw new ErrMobileExists();
    }

    const hashedPassword = await bcrypt.hash(
      input.password,
      this.config.auth.bcryptSaltRounds,
    );

    try {
      const user = await this.userRepo.createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        mobileNumber: input.mobileNumber,
        status: input.status ?? UserStatus.ACTIVE,
      });
      return transformUserToResponse(user);
    } catch (error) {
      if (isUniqueConstraintFailed(error)) {
        throw new ErrEmailExists();
      }
      this.logger.error({ error }, 'Failed to create user');
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    try {
      const user = await this.userReadRepo.getUserById(id);
      return transformUserToResponse(user);
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new ErrUserNotFound();
      }
      throw error;
    }
  }

  async updateUser(
    id: number,
    input: UpdateUserInput,
  ): Promise<UserResponseDto> {
    await this.getUserById(id);

    if (input.email) {
      const existing = await this.userReadRepo.findUserByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ErrEmailExists();
      }
    }

    if (input.mobileNumber) {
      const existing = await this.userReadRepo.findUserByMobile(
        input.mobileNumber,
      );
      if (existing && existing.id !== id) {
        throw new ErrMobileExists();
      }
    }

    const updateData: UpdateUserInput = { ...input };
    if (input.password) {
      updateData.password = await bcrypt.hash(
        input.password,
        this.config.auth.bcryptSaltRounds,
      );
    }

    const updated = await this.userRepo.updateUserById(id, updateData);
    if (!updated) {
      throw new ErrUserNotFound();
    }

    return transformUserToResponse(updated);
  }

  async softDeleteUser(id: number): Promise<void> {
    await this.getUserById(id);
    const deleted = await this.userRepo.softDeleteUserById(id);
    if (!deleted) {
      throw new ErrUserNotFound();
    }
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
}
