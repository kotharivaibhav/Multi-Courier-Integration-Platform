import { RequestHandler, Router } from 'express';
import { AppContext } from '../../../bootstrap/app-context';
import { validateRequestInterceptor } from '../../shared/interceptors/req-validator/request-validator';
import { adminAuthInterceptor } from '../../shared/interceptors/admin-auth/admin-auth';
import { BaseHeadersSchema } from '../../shared/headers/schema/base-headers';
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  LoginSchema,
  UpdateUserSchema,
  UserIdParamSchema,
} from '../dto/request';

export function userRouter(router: Router, ctx: AppContext) {
  const controller = ctx.userController;
  const adminAuth = adminAuthInterceptor(ctx);
  const v1Router = Router();

  v1Router.post(
    '/login',
    validateRequestInterceptor(ctx, {
      body: LoginSchema,
      headers: BaseHeadersSchema,
    }),
    controller.login.bind(controller) as RequestHandler,
  );

  v1Router.post(
    '/',
    adminAuth,
    validateRequestInterceptor(ctx, {
      body: CreateUserSchema,
      headers: BaseHeadersSchema,
    }),
    controller.createUser.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/',
    adminAuth,
    validateRequestInterceptor(ctx, {
      query: ListUsersQuerySchema,
      headers: BaseHeadersSchema,
    }),
    controller.listUsers.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/:id',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.getUserById.bind(controller) as RequestHandler,
  );

  v1Router.put(
    '/:id',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      body: UpdateUserSchema,
      headers: BaseHeadersSchema,
    }),
    controller.updateUser.bind(controller) as RequestHandler,
  );

  v1Router.delete(
    '/:id',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.softDeleteUser.bind(controller) as RequestHandler,
  );

  router.use('/admin/v1/users', v1Router);
}
