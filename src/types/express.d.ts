import 'express-serve-static-core';
import { UserResponseDto } from '../internal/user/dto/user';

declare module 'express-serve-static-core' {
  interface Request {
    validatedQuery?: unknown;
    adminUser?: UserResponseDto;
  }
}
