import { Request, Response, NextFunction } from 'express';

export interface UserController {
  login(req: Request, res: Response, next: NextFunction): Promise<void>;
  createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  softDeleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  listUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
}
