import {
  BulkBatch,
  CourierApiLog,
  CourierApiOperation,
  Prisma,
  ShipmentOrder,
  ShipmentStatus,
  ShipmentTrackingHistory,
  WebhookEvent,
} from '@prisma/client';
import { ShipmentReadRepository } from './shipment-read';

export interface ShipmentRepository extends ShipmentReadRepository {
  createShipmentOrder(data: {
    orderId: string;
    courierPartner: string;
    status: ShipmentStatus;
    requestPayload: Prisma.InputJsonValue;
    batchId?: string;
  }): Promise<ShipmentOrder>;
  updateShipmentOrder(
    id: number,
    data: Partial<{
      courierOrderId: string;
      awbNumber: string;
      status: ShipmentStatus;
      responsePayload: Prisma.InputJsonValue;
      labelUrl: string;
      failureReason: string;
    }>,
  ): Promise<ShipmentOrder>;
  appendTrackingHistory(data: {
    shipmentId: number;
    status: ShipmentStatus;
    location?: string;
    description?: string;
    rawPayload: Prisma.InputJsonValue;
    eventAt?: Date;
  }): Promise<ShipmentTrackingHistory>;
  createApiLog(data: {
    shipmentId?: number;
    orderId?: string;
    courierPartner: string;
    operation: CourierApiOperation;
    requestPayload?: Prisma.InputJsonValue;
    responsePayload?: Prisma.InputJsonValue;
    httpStatus?: number;
    errorCode?: string;
    errorMessage?: string;
    requestId?: string;
    durationMs?: number;
  }): Promise<CourierApiLog>;
  createBulkBatch(totalCount: number): Promise<BulkBatch>;
  updateBulkBatch(
    batchId: string,
    data: Partial<{
      status: BulkBatch['status'];
      successCount: number;
      failedCount: number;
      results: Prisma.InputJsonValue;
    }>,
  ): Promise<BulkBatch>;
  createWebhookEvent(data: {
    courierPartner: string;
    awbNumber?: string;
    orderId?: string;
    payload: Prisma.InputJsonValue;
  }): Promise<WebhookEvent>;
  markWebhookProcessed(id: number, errorMessage?: string): Promise<void>;
}
