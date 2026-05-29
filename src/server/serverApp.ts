import express, { Application } from 'express';
import { AppContext } from '../bootstrap/app-context';
import { setupMiddlewares } from './middlewares';
import { addRoutes } from '../router/routes';
import { errorHandlerMiddleware } from './middlewares/error-handler';

export function createExpressApp(ctx: AppContext): Application {
  const app = express();

  setupMiddlewares(app, ctx);
  addRoutes(app, ctx);
  app.use(errorHandlerMiddleware(ctx));

  return app;
}
