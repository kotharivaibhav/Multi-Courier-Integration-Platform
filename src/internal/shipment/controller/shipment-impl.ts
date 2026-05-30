import { ShipmentController } from './shipment';
import { NextFunction, Request, Response } from 'express';
import { ShipmentService } from '../service/shipment';
import { ResponseBuilder } from '../../../pkg/httpresponse/response';
import { AppAPIError } from '../../../pkg/httpresponse/app-api-err';
import { SHIPMENT_MESSAGES } from '../constants/shipment';
import {
  BulkCreateShipmentsRequest,
  CreateShipmentRequest,
} from '../dto/request';
import { HEADERS } from '../../../base/headers/constants';
import { StatusCodes } from 'http-status-codes';

export class ShipmentControllerImpl implements ShipmentController {
  private readonly shipmentService: ShipmentService;

  constructor(shipmentService: ShipmentService) {
    this.shipmentService = shipmentService;
  }

  async createShipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const body = req.body as CreateShipmentRequest;
      const requestId = req.headers[HEADERS.X_REQUEST_ID] as string;
      const shipment = await this.shipmentService.createShipment(
        body,
        requestId,
      );
      response
        .setResponse(shipment)
        .setMessage(SHIPMENT_MESSAGES.CREATED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async trackShipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const orderId = String(req.params.order_id);
      const requestId = req.headers[HEADERS.X_REQUEST_ID] as string;
      const result = await this.shipmentService.trackShipment(
        orderId,
        requestId,
      );
      response
        .setResponse(result)
        .setMessage(SHIPMENT_MESSAGES.TRACKED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async cancelShipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const orderId = String(req.params.order_id);
      const requestId = req.headers[HEADERS.X_REQUEST_ID] as string;
      const result = await this.shipmentService.cancelShipment(
        orderId,
        requestId,
      );
      response
        .setResponse(result)
        .setMessage(SHIPMENT_MESSAGES.CANCELLED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async bulkCreateShipments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const body = req.body as BulkCreateShipmentsRequest;
      const requestId = req.headers[HEADERS.X_REQUEST_ID] as string;
      const { batchId } = await this.shipmentService.bulkCreateShipments(
        body.orders,
        requestId,
      );
      response
        .setResponse({ batch_id: batchId, status: 'PROCESSING' })
        .setMessage(SHIPMENT_MESSAGES.BATCH_ACCEPTED)
        .setHTTPCode(StatusCodes.ACCEPTED)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async getBulkBatchStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const batchId = String(req.params.batch_id);
      const result = await this.shipmentService.getBulkBatchStatus(batchId);
      response
        .setResponse(result)
        .setMessage(SHIPMENT_MESSAGES.BATCH_STATUS)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async listCouriers(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const result = await this.shipmentService.listCouriers();
      response
        .setResponse(result)
        .setMessage(SHIPMENT_MESSAGES.COURIERS_LIST)
        .build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }

  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const response = new ResponseBuilder();
    try {
      const courierPartner = String(req.params.courier_partner);
      const requestId = req.headers[HEADERS.X_REQUEST_ID] as string;
      await this.shipmentService.handleWebhook(
        courierPartner,
        req.body as Record<string, unknown>,
        requestId,
      );
      response.setMessage('Webhook processed').build(res);
    } catch (error) {
      if (error instanceof AppAPIError) {
        response.setApiError(error).build(res);
        return;
      }
      next(error);
    }
  }
}
