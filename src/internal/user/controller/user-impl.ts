import { UserController } from './user';
import { NextFunction, Request, Response } from 'express';
import { UserService } from '../service/user';
import { ResponseBuilder } from '../../../pkg/httpresponse/response';
import { AppAPIError } from '../../../pkg/httpresponse/app-api-err';
import { USER_MESSAGES } from '../constants/user';
import {
  CreateUserRequest,
  ListUsersQuery,
  LoginRequest,
  UpdateUserRequest,
} from '../dto/request';
import { StatusCodes } from 'http-status-codes';

export class UserControllerImpl implements UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const body = req.body as LoginRequest;
      const result = await this.userService.login(body);
      response
        .setResponse(result)
        .setMessage(USER_MESSAGES.LOGIN_SUCCESS)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const body = req.body as CreateUserRequest;
      const user = await this.userService.createUser(body);
      response
        .setResponse(user)
        .setMessage(USER_MESSAGES.CREATED)
        .setHTTPCode(StatusCodes.CREATED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const id = Number(req.params.id);
      const user = await this.userService.getUserById(id);
      response.setResponse(user).setMessage(USER_MESSAGES.FETCHED).build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const id = Number(req.params.id);
      const body = req.body as UpdateUserRequest;
      const user = await this.userService.updateUser(id, body);
      response.setResponse(user).setMessage(USER_MESSAGES.UPDATED).build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async softDeleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const id = Number(req.params.id);
      await this.userService.softDeleteUser(id);
      response.setMessage(USER_MESSAGES.DELETED).build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const query = req.validatedQuery as ListUsersQuery;
      const result = await this.userService.listUsers(query);
      response
        .setResponse(result)
        .setMessage(USER_MESSAGES.LIST_FETCHED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }
}
