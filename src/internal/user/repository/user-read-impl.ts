import { UserReadRepository } from './user-read';
import { MysqlClient } from '../../../pkg/mysql/client';
import { User } from '@prisma/client';
import { ListUsersInput } from '../dto/user';
import { newPrismaNotFoundError } from '../../../pkg/prisma/errors';

const NOT_DELETED = { deletedAt: null };

export class UserReadRepositoryImpl implements UserReadRepository {
  private db: MysqlClient;

  constructor(db: MysqlClient) {
    this.db = db;
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.db.client.user.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!user) {
      throw newPrismaNotFoundError();
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.db.client.user.findFirst({
      where: { email, ...NOT_DELETED },
    });
  }

  async findUserByMobile(mobileNumber: string): Promise<User | null> {
    return this.db.client.user.findFirst({
      where: { mobileNumber, ...NOT_DELETED },
    });
  }

  async listUsers(input: ListUsersInput): Promise<{ users: User[]; total: number }> {
    const where = {
      ...NOT_DELETED,
      ...(input.status ? { status: input.status } : {}),
    };

    const skip = (input.page - 1) * input.limit;

    const [users, total] = await Promise.all([
      this.db.client.user.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.client.user.count({ where }),
    ]);

    return { users, total };
  }
}
