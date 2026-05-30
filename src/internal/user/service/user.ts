import {
  CreateUserInput,
  ListUsersInput,
  LoginInput,
  LoginResponseDto,
  UpdateUserInput,
  UserListResponseDto,
  UserResponseDto,
} from '../dto/user';

export interface UserService {
  login(input: LoginInput): Promise<LoginResponseDto>;
  getActiveUserById(id: number): Promise<UserResponseDto>;
  createUser(input: CreateUserInput): Promise<UserResponseDto>;
  getUserById(id: number): Promise<UserResponseDto>;
  updateUser(id: number, input: UpdateUserInput): Promise<UserResponseDto>;
  softDeleteUser(id: number): Promise<void>;
  listUsers(input: ListUsersInput): Promise<UserListResponseDto>;
}
