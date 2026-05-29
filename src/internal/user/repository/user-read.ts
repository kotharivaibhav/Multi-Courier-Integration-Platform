import { User } from '@prisma/client';
import { ListUsersInput } from '../dto/user';

export interface UserReadRepository {
  getUserById(id: number): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByMobile(mobileNumber: string): Promise<User | null>;
  listUsers(input: ListUsersInput): Promise<{ users: User[]; total: number }>;
}
