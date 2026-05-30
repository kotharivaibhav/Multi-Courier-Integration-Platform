import { UserStatus } from '@prisma/client';

export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponseDto {
  token: string;
  user: UserResponseDto;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  mobileNumber: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  mobileNumber?: string;
  status?: UserStatus;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ListUsersInput {
  page: number;
  limit: number;
  status?: UserStatus;
}
