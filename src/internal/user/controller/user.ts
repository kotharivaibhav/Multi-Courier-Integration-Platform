import { NextFunction, Request, Response } from 'express';

export interface UserController {
  createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  softDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  listUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
}
