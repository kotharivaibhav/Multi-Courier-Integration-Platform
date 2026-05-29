import { User, UserStatus } from '@prisma/client';
import { UserReadRepository } from './user-read';

export interface UserRepository extends UserReadRepository {
  createUser(data: {
    name: string;
    email: string;
    password: string;
    mobileNumber: string;
    status: UserStatus;
  }): Promise<User>;
  updateUserById(id: number, data: Partial<User>): Promise<User | null>;
  softDeleteUserById(id: number): Promise<User | null>;
}
