import { UserReadRepository } from './user-read';
import { MysqlClient } from '../../../pkg/mysql/client';
import { User } from '@prisma/client';
import { ListUsersInput } from '../dto/user';
import { newPrismaNotFoundError } from '../../../pkg/prisma/errors';

export class UserReadRepositoryImpl implements UserReadRepository {
  private readonly db: MysqlClient;

  constructor(db: MysqlClient) {
    this.db = db;
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.db.client.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw newPrismaNotFoundError();
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.client.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findUserByMobile(mobileNumber: string): Promise<User | null> {
    return this.db.client.user.findFirst({
      where: { mobileNumber, deletedAt: null },
    });
  }

  async listUsers(
    input: ListUsersInput,
  ): Promise<{ users: User[]; total: number }> {
    const where = {
      deletedAt: null,
      ...(input.status ? { status: input.status } : {}),
    };
    const skip = (input.page - 1) * input.limit;

    const [users, total] = await Promise.all([
      this.db.client.user.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { id: 'desc' },
      }),
      this.db.client.user.count({ where }),
    ]);

    return { users, total };
  }
}
