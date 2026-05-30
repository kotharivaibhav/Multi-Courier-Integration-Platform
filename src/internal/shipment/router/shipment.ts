import { RequestHandler, Router } from 'express';
import { AppContext } from '../../../bootstrap/app-context';
import { validateRequestInterceptor } from '../../shared/interceptors/req-validator/request-validator';
import { BaseHeadersSchema } from '../../shared/headers/schema/base-headers';
import {
  BatchIdParamSchema,
  BulkCreateShipmentsSchema,
  CreateShipmentSchema,
  ShipmentIdParamSchema,
  WebhookParamSchema,
} from '../dto/request';
import { adminAuthInterceptor } from '../../shared/interceptors/admin-auth/admin-auth';

export function shipmentRouter(router: Router, ctx: AppContext) {
  const controller = ctx.shipmentController;
  const adminAuth = adminAuthInterceptor(ctx);
  const v1Router = Router();

  v1Router.get(
    '/couriers',
    adminAuth,
    validateRequestInterceptor(ctx, { headers: BaseHeadersSchema }),
    controller.listCouriers.bind(controller) as RequestHandler,
  );

  v1Router.post(
    '/orders',
    adminAuth,
    validateRequestInterceptor(ctx, {
      body: CreateShipmentSchema,
      headers: BaseHeadersSchema,
    }),
    controller.createShipment.bind(controller) as RequestHandler,
  );

  v1Router.post(
    '/orders/bulk',
    adminAuth,
    validateRequestInterceptor(ctx, {
      body: BulkCreateShipmentsSchema,
      headers: BaseHeadersSchema,
    }),
    controller.bulkCreateShipments.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/orders/bulk/:batch_id',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: BatchIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.getBulkBatchStatus.bind(controller) as RequestHandler,
  );

  v1Router.get(
    '/orders/:order_id/track',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: ShipmentIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.trackShipment.bind(controller) as RequestHandler,
  );

  v1Router.post(
    '/orders/:order_id/cancel',
    adminAuth,
    validateRequestInterceptor(ctx, {
      params: ShipmentIdParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.cancelShipment.bind(controller) as RequestHandler,
  );

  v1Router.post(
    '/webhooks/:courier_partner',
    validateRequestInterceptor(ctx, {
      params: WebhookParamSchema,
      headers: BaseHeadersSchema,
    }),
    controller.handleWebhook.bind(controller) as RequestHandler,
  );

  router.use('/v1', v1Router);
}
