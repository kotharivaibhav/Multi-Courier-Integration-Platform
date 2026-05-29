import { Application, Router } from 'express';
import { AppContext } from '../bootstrap/app-context';
import { userRouter } from '../internal/user/router/user';

export function addRoutes(app: Application, ctx: AppContext) {
  const apiGroup = Router();

  userRouter(apiGroup, ctx);

  app.use('/api', apiGroup);
}
