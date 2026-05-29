import { RequestHandler, Router } from 'express';
import { AppContext } from '../../../bootstrap/app-context';
import { validateRequestInterceptor } from '../../shared/interceptors/req-validator/request-validator';
import { BaseHeadersSchema } from '../../shared/headers/schema/base-headers';
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserIdParamSchema,
} from '../dto/request';

export function userRouter(router: Router, ctx: AppContext) {
  const controller = ctx.userController;
  const v1Router = Router();

  v1Router.post(
    '/',
    validateRequestInterceptor(ctx, {
      body: CreateUserSchema,
      headers: BaseHeadersSchema,
    }),
    controller.createUser.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/',
    validateRequestInterceptor(ctx, {
      query: ListUsersQuerySchema,
      headers: BaseHeadersSchema,
    }),
    controller.listUsers.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/:id',
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.getUserById.bind(controller) as RequestHandler,
  );

  v1Router.put(
    '/:id',
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      body: UpdateUserSchema,
      headers: BaseHeadersSchema,
    }),
    controller.updateUser.bind(controller) as RequestHandler,
  );

  v1Router.delete(
    '/:id',
    validateRequestInterceptor(ctx, {
      params: UserIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.softDeleteUser.bind(controller) as RequestHandler,
  );

  router.use('/user/v1', v1Router);
}
