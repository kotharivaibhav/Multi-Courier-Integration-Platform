import { ShipmentService } from './shipment';
import { ShipmentRepository } from '../repository/shipment';
import { ShipmentReadRepository } from '../repository/shipment-read';
import { CourierAdapterFactory } from '../../../external/courier/factory/courier-adapter-factory';
import pino from 'pino';
import { AppConfig } from '../../../config';
import { CreateShipmentRequest } from '../dto/request';
import {
  BulkShipmentResponseDto,
  BulkShipmentResultItem,
  CancelShipmentResponseDto,
  CouriersListResponseDto,
  ShipmentResponseDto,
  TrackShipmentResponseDto,
} from '../dto/response';
import {
  toNormalizedCreateInput,
  transformCancelResponse,
  transformShipmentToResponse,
  transformTrackResponse,
} from '../transformers/shipment';
import {
  ErrCourierApi,
  ErrNotFound,
} from '../../../pkg/httpresponse/api-errors';
import { SHIPMENT_MESSAGES } from '../constants/shipment';
import {
  BulkBatchStatus,
  CourierApiOperation,
  Prisma,
  ShipmentStatus,
} from '@prisma/client';
import { AppAPIError } from '../../../pkg/httpresponse/app-api-err';
import { ErrorCode } from '../../../pkg/httpresponse/error-codes';
import Logger = pino.Logger;

const NON_CANCELLABLE: ShipmentStatus[] = [
  ShipmentStatus.DELIVERED,
  ShipmentStatus.CANCELLED,
  ShipmentStatus.RTO,
];

export class ShipmentServiceImpl implements ShipmentService {
  private readonly shipmentRepo: ShipmentRepository;
  private readonly shipmentReadRepo: ShipmentReadRepository;
  private readonly courierFactory: CourierAdapterFactory;
  private readonly logger: Logger;
  private readonly config: AppConfig;

  constructor(
    shipmentRepo: ShipmentRepository,
    shipmentReadRepo: ShipmentReadRepository,
    courierFactory: CourierAdapterFactory,
    logger: Logger,
    config: AppConfig,
  ) {
    this.shipmentRepo = shipmentRepo;
    this.shipmentReadRepo = shipmentReadRepo;
    this.courierFactory = courierFactory;
    this.logger = logger;
    this.config = config;
  }

  async createShipment(
    request: CreateShipmentRequest,
    requestId?: string,
  ): Promise<ShipmentResponseDto> {
    const existing = await this.shipmentReadRepo.findByOrderId(
      request.order_id,
    );
    if (existing && existing.awbNumber) {
      return transformShipmentToResponse(existing);
    }

    const order = await this.processCreateShipment(
      request,
      undefined,
      requestId,
    );
    return transformShipmentToResponse(order);
  }

  async trackShipment(
    orderId: string,
    requestId?: string,
  ): Promise<TrackShipmentResponseDto> {
    const order = await this.shipmentReadRepo.findByOrderId(orderId);
    if (!order || !order.awbNumber) {
      throw new ErrNotFound(SHIPMENT_MESSAGES.NOT_FOUND);
    }

    const adapter = this.courierFactory.getAdapter(order.courierPartner);
    const start = Date.now();

    try {
      const trackResult = await adapter.trackShipment(order.awbNumber);

      await this.shipmentRepo.updateShipmentOrder(order.id, {
        status: trackResult.currentStatus,
        responsePayload: trackResult.rawResponse as object,
      });

      for (const event of trackResult.events) {
        await this.shipmentRepo.appendTrackingHistory({
          shipmentId: order.id,
          status: event.status,
          location: event.location,
          description: event.description,
          rawPayload: event as object,
          eventAt: new Date(),
        });
      }

      await this.shipmentRepo.createApiLog({
        shipmentId: order.id,
        orderId,
        courierPartner: order.courierPartner,
        operation: CourierApiOperation.TRACK_SHIPMENT,
        responsePayload: trackResult.rawResponse as object,
        requestId,
        durationMs: Date.now() - start,
      });

      const history = await this.shipmentReadRepo.listTrackingHistory(order.id);
      const events = history.map((h) => ({
        status: h.status,
        description: h.description,
        location: h.location,
        event_at: h.eventAt,
      }));

      return transformTrackResponse(
        { ...order, status: trackResult.currentStatus },
        trackResult.currentStatusDescription,
        trackResult.currentLocation ?? null,
        events,
      );
    } catch (error) {
      await this.logCourierFailure(
        order,
        CourierApiOperation.TRACK_SHIPMENT,
        error,
        requestId,
        Date.now() - start,
      );
      throw error;
    }
  }

  async cancelShipment(
    orderId: string,
    requestId?: string,
  ): Promise<CancelShipmentResponseDto> {
    const order = await this.shipmentReadRepo.findByOrderId(orderId);
    if (!order || !order.awbNumber) {
      throw new ErrNotFound(SHIPMENT_MESSAGES.NOT_FOUND);
    }

    if (NON_CANCELLABLE.includes(order.status)) {
      throw new ErrCourierApi(
        ErrorCode.ORDER_NOT_CANCELLABLE,
        SHIPMENT_MESSAGES.NOT_CANCELLABLE,
      );
    }

    const adapter = this.courierFactory.getAdapter(order.courierPartner);
    const start = Date.now();

    try {
      const cancelResult = await adapter.cancelShipment(
        order.awbNumber,
        order.courierOrderId ?? undefined,
      );

      const updated = await this.shipmentRepo.updateShipmentOrder(order.id, {
        status: ShipmentStatus.CANCELLED,
        responsePayload: cancelResult.rawResponse as object,
      });

      await this.shipmentRepo.appendTrackingHistory({
        shipmentId: order.id,
        status: ShipmentStatus.CANCELLED,
        description: cancelResult.message,
        rawPayload: cancelResult.rawResponse as object,
      });

      await this.shipmentRepo.createApiLog({
        shipmentId: order.id,
        orderId,
        courierPartner: order.courierPartner,
        operation: CourierApiOperation.CANCEL_SHIPMENT,
        requestPayload: cancelResult.rawRequest as object,
        responsePayload: cancelResult.rawResponse as object,
        requestId,
        durationMs: Date.now() - start,
      });

      return transformCancelResponse(updated, cancelResult.message);
    } catch (error) {
      await this.logCourierFailure(
        order,
        CourierApiOperation.CANCEL_SHIPMENT,
        error,
        requestId,
        Date.now() - start,
      );
      throw error;
    }
  }

  async bulkCreateShipments(
    orders: CreateShipmentRequest[],
    requestId?: string,
  ): Promise<{ batchId: string }> {
    const batch = await this.shipmentRepo.createBulkBatch(orders.length);
    const batchId = batch.id;

    setImmediate(() => {
      this.processBulkBatch(batchId, orders, requestId).catch((error) => {
        this.logger.error(
          { batchId, error, requestId },
          'Bulk batch processing failed',
        );
      });
    });

    return { batchId };
  }

  async getBulkBatchStatus(batchId: string): Promise<BulkShipmentResponseDto> {
    const batch = await this.shipmentReadRepo.findBulkBatch(batchId);
    if (!batch) {
      throw new ErrNotFound(SHIPMENT_MESSAGES.BATCH_NOT_FOUND);
    }

    return {
      batch_id: batch.id,
      status: batch.status,
      total: batch.totalCount,
      success_count: batch.successCount,
      failed_count: batch.failedCount,
      results: (batch.results as BulkShipmentResultItem[] | null) ?? undefined,
    };
  }

  listCouriers(): Promise<CouriersListResponseDto> {
    return Promise.resolve({
      couriers: this.courierFactory.getSupportedPartners(),
    });
  }

  async handleWebhook(
    courierPartner: string,
    payload: Record<string, unknown>,
    requestId?: string,
  ): Promise<void> {
    const event = await this.shipmentRepo.createWebhookEvent({
      courierPartner,
      awbNumber: payload.awb_number as string | undefined,
      orderId: payload.order_id as string | undefined,
      payload: payload as Prisma.InputJsonValue,
    });

    try {
      const awb =
        (payload.awb_number as string) ??
        (payload.awbNumber as string) ??
        (payload.awb as string);
      const orderId = payload.order_id as string | undefined;

      let order = orderId
        ? await this.shipmentReadRepo.findByOrderId(orderId)
        : null;

      if (!order && awb) {
        order = await this.findOrderByAwb(awb);
      }

      if (order) {
        const statusCode =
          (payload.status_code as string) ??
          (payload.currentStatusCode as string) ??
          'IN_TRANSIT';
        const status = this.mapWebhookStatus(statusCode);

        await this.shipmentRepo.updateShipmentOrder(order.id, { status });
        await this.shipmentRepo.appendTrackingHistory({
          shipmentId: order.id,
          status,
          description: (payload.description as string) ?? statusCode,
          location: payload.location as string | undefined,
          rawPayload: payload as Prisma.InputJsonValue,
        });
      }

      await this.shipmentRepo.createApiLog({
        shipmentId: order?.id,
        orderId: order?.orderId,
        courierPartner,
        operation: CourierApiOperation.WEBHOOK,
        requestPayload: payload as Prisma.InputJsonValue,
        requestId,
      });

      await this.shipmentRepo.markWebhookProcessed(event.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.shipmentRepo.markWebhookProcessed(event.id, message);
      throw error;
    }
  }

  private async processBulkBatch(
    batchId: string,
    orders: CreateShipmentRequest[],
    requestId?: string,
  ): Promise<void> {
    await this.shipmentRepo.updateBulkBatch(batchId, {
      status: BulkBatchStatus.PROCESSING,
    });

    const concurrency = this.config.bulk.concurrency;
    const results: BulkShipmentResultItem[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < orders.length; i += concurrency) {
      const chunk = orders.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(async (orderReq) =>
          this.processBulkShipmentItem(orderReq, batchId, requestId),
        ),
      );

      for (const item of chunkResults) {
        results.push(item);
        if (item.success) successCount++;
        else failedCount++;
      }
    }

    const status =
      failedCount === 0
        ? BulkBatchStatus.COMPLETED
        : successCount === 0
          ? BulkBatchStatus.FAILED
          : BulkBatchStatus.PARTIAL_FAILURE;

    await this.shipmentRepo.updateBulkBatch(batchId, {
      status,
      successCount,
      failedCount,
      results: results as unknown as Prisma.InputJsonValue,
    });
  }

  private async processBulkShipmentItem(
    request: CreateShipmentRequest,
    batchId: string,
    requestId?: string,
  ): Promise<BulkShipmentResultItem> {
    try {
      const order = await this.processCreateShipment(
        request,
        batchId,
        requestId,
      );
      return {
        order_id: request.order_id,
        success: true,
        data: transformShipmentToResponse(order),
      };
    } catch (error) {
      const code =
        error instanceof AppAPIError
          ? ((error as AppAPIError & { errorCode?: ErrorCode }).errorCode ??
            ErrorCode.INTERNAL_ERROR)
          : ErrorCode.INTERNAL_ERROR;

      this.logger.error(
        {
          orderId: request.order_id,
          courierPartner: request.courier_partner,
          requestId,
          errorType: code,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Bulk order item failed',
      );

      return {
        order_id: request.order_id,
        success: false,
        error: {
          code,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async processCreateShipment(
    request: CreateShipmentRequest,
    batchId?: string,
    requestId?: string,
  ) {
    const existing = await this.shipmentReadRepo.findByOrderId(
      request.order_id,
    );
    if (existing?.awbNumber) {
      return existing;
    }

    const adapter = this.courierFactory.getAdapter(request.courier_partner);
    const normalizedInput = toNormalizedCreateInput(request);

    let shipment = existing;
    if (!shipment) {
      shipment = await this.shipmentRepo.createShipmentOrder({
        orderId: request.order_id,
        courierPartner: request.courier_partner.toLowerCase(),
        status: ShipmentStatus.CREATED,
        requestPayload: request as object,
        batchId,
      });
    }

    const start = Date.now();
    try {
      const result = await adapter.createShipment(normalizedInput);

      const updated = await this.shipmentRepo.updateShipmentOrder(shipment.id, {
        courierOrderId: result.courierOrderId,
        awbNumber: result.awbNumber,
        status: result.status,
        responsePayload: result.rawResponse as object,
        labelUrl: result.labelUrl,
      });

      await this.shipmentRepo.appendTrackingHistory({
        shipmentId: shipment.id,
        status: result.status,
        description: 'Shipment created',
        rawPayload: result.rawResponse as object,
      });

      await this.shipmentRepo.createApiLog({
        shipmentId: shipment.id,
        orderId: request.order_id,
        courierPartner: request.courier_partner,
        operation: CourierApiOperation.CREATE_SHIPMENT,
        requestPayload: result.rawRequest as object,
        responsePayload: result.rawResponse as object,
        requestId,
        durationMs: Date.now() - start,
      });

      return updated;
    } catch (error) {
      await this.shipmentRepo.updateShipmentOrder(shipment.id, {
        status: ShipmentStatus.FAILED,
        failureReason: error instanceof Error ? error.message : String(error),
      });
      await this.logCourierFailure(
        shipment,
        CourierApiOperation.CREATE_SHIPMENT,
        error,
        requestId,
        Date.now() - start,
        normalizedInput as object,
      );
      throw error;
    }
  }

  private async logCourierFailure(
    order: { id: number; orderId: string; courierPartner: string },
    operation: CourierApiOperation,
    error: unknown,
    requestId?: string,
    durationMs?: number,
    requestPayload?: object,
  ): Promise<void> {
    const errorCode =
      error instanceof AppAPIError
        ? (error as AppAPIError & { errorCode?: ErrorCode }).errorCode
        : ErrorCode.COURIER_SERVER_ERROR;

    this.logger.error(
      {
        orderId: order.orderId,
        courierPartner: order.courierPartner,
        requestId,
        errorType: errorCode,
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Courier operation failed',
    );

    await this.shipmentRepo.createApiLog({
      shipmentId: order.id,
      orderId: order.orderId,
      courierPartner: order.courierPartner,
      operation,
      requestPayload,
      errorCode,
      errorMessage: error instanceof Error ? error.message : String(error),
      requestId,
      durationMs,
    });
  }

  private async findOrderByAwb(awb: string) {
    return this.shipmentReadRepo.findByAwbNumber(awb);
  }

  private mapWebhookStatus(code: string): ShipmentStatus {
    const upper = code.toUpperCase();
    const map: Record<string, ShipmentStatus> = {
      MAN: ShipmentStatus.CREATED,
      PKD: ShipmentStatus.PICKED_UP,
      INT: ShipmentStatus.IN_TRANSIT,
      OFD: ShipmentStatus.OUT_FOR_DELIVERY,
      DLV: ShipmentStatus.DELIVERED,
      CAN: ShipmentStatus.CANCELLED,
      RTO: ShipmentStatus.RTO,
    };
    return map[upper] ?? ShipmentStatus.IN_TRANSIT;
  }
}
