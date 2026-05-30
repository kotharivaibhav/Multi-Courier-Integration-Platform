import { UserRepository } from './user';
import { MysqlClient } from '../../../pkg/mysql/client';
import { UserReadRepository } from './user-read';
import { User, UserStatus } from '@prisma/client';
import { ListUsersInput } from '../dto/user';

export class UserRepositoryImpl implements UserRepository {
  private readRepository: UserReadRepository;
  private db: MysqlClient;

  constructor(readRepository: UserReadRepository, db: MysqlClient) {
    this.readRepository = readRepository;
    this.db = db;
  }

  async getUserById(id: number): Promise<User> {
    return this.readRepository.getUserById(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.readRepository.findUserByEmail(email);
  }

  async findUserByMobile(mobileNumber: string): Promise<User | null> {
    return this.readRepository.findUserByMobile(mobileNumber);
  }

  async listUsers(
    input: ListUsersInput,
  ): Promise<{ users: User[]; total: number }> {
    return this.readRepository.listUsers(input);
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    mobileNumber: string;
    status: UserStatus;
  }): Promise<User> {
    return this.db.client.user.create({ data });
  }

  async updateUserById(id: number, data: Partial<User>): Promise<User | null> {
    const existing = await this.db.client.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return null;
    }
    return this.db.client.user.update({
      where: { id },
      data,
    });
  }

  async softDeleteUserById(id: number): Promise<User | null> {
    return this.db.client.user.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });
  }
}
