import express, { Application } from 'express';
import { AppContext } from '../../bootstrap/app-context';
import { requestIdMiddleware } from './request-id';
import { loggerMiddleware } from './logger';
import { configureCors } from './cors';
import helmet from 'helmet';
import compression from 'compression';

export function setupMiddlewares(app: Application, ctx: AppContext): void {
  app.use(express.json());
  app.use(configureCors());
  app.use(helmet());
  app.use(compression());
  app.use(requestIdMiddleware());
  app.use(loggerMiddleware(ctx));
}
