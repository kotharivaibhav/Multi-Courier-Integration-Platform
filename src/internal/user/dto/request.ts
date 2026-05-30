import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import { USER_DEFAULTS } from '../constants/user';

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10,15}$/, 'Mobile number must be 10-15 digits'),
  status: z.nativeEnum(UserStatus).optional(),
});

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).optional(),
    password: z.string().min(8).max(128).optional(),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10,15}$/, 'Mobile number must be 10-15 digits')
      .optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const UserIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(USER_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(USER_DEFAULTS.MAX_LIMIT)
    .default(USER_DEFAULTS.DEFAULT_LIMIT),
  status: z.nativeEnum(UserStatus).optional(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
