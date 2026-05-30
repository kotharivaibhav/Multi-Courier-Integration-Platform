import { Application, Router } from 'express';
import { AppContext } from '../bootstrap/app-context';
import { userRouter } from '../internal/user/router/user';
import { shipmentRouter } from '../internal/shipment/router/shipment';

export function addRoutes(app: Application, ctx: AppContext) {
  const apiGroup = Router();

  userRouter(apiGroup, ctx);
  shipmentRouter(apiGroup, ctx);

  app.use('/api', apiGroup);
}
