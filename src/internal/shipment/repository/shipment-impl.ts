import { ShipmentRepository } from './shipment';
import { MysqlClient } from '../../../pkg/mysql/client';
import { ShipmentReadRepository } from './shipment-read';
import {
  BulkBatchStatus,
  CourierApiOperation,
  Prisma,
  ShipmentStatus,
} from '@prisma/client';

export class ShipmentRepositoryImpl implements ShipmentRepository {
  private readRepository: ShipmentReadRepository;
  private db: MysqlClient;

  constructor(readRepository: ShipmentReadRepository, db: MysqlClient) {
    this.readRepository = readRepository;
    this.db = db;
  }

  findByOrderId(orderId: string) {
    return this.readRepository.findByOrderId(orderId);
  }

  findByAwbNumber(awbNumber: string) {
    return this.readRepository.findByAwbNumber(awbNumber);
  }

  findBulkBatch(batchId: string) {
    return this.readRepository.findBulkBatch(batchId);
  }

  listTrackingHistory(shipmentId: number) {
    return this.readRepository.listTrackingHistory(shipmentId);
  }

  createShipmentOrder(data: {
    orderId: string;
    courierPartner: string;
    status: ShipmentStatus;
    requestPayload: Prisma.InputJsonValue;
    batchId?: string;
  }) {
    return this.db.client.shipmentOrder.create({ data });
  }

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
  ) {
    return this.db.client.shipmentOrder.update({ where: { id }, data });
  }

  appendTrackingHistory(data: {
    shipmentId: number;
    status: ShipmentStatus;
    location?: string;
    description?: string;
    rawPayload: Prisma.InputJsonValue;
    eventAt?: Date;
  }) {
    return this.db.client.shipmentTrackingHistory.create({ data });
  }

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
  }) {
    return this.db.client.courierApiLog.create({ data });
  }

  createBulkBatch(totalCount: number) {
    return this.db.client.bulkBatch.create({
      data: { totalCount, status: BulkBatchStatus.PENDING },
    });
  }

  updateBulkBatch(
    batchId: string,
    data: Partial<{
      status: BulkBatchStatus;
      successCount: number;
      failedCount: number;
      results: Prisma.InputJsonValue;
    }>,
  ) {
    return this.db.client.bulkBatch.update({ where: { id: batchId }, data });
  }

  createWebhookEvent(data: {
    courierPartner: string;
    awbNumber?: string;
    orderId?: string;
    payload: Prisma.InputJsonValue;
  }) {
    return this.db.client.webhookEvent.create({ data });
  }

  async markWebhookProcessed(id: number, errorMessage?: string): Promise<void> {
    await this.db.client.webhookEvent.update({
      where: { id },
      data: {
        processed: !errorMessage,
        processedAt: new Date(),
        errorMessage,
      },
    });
  }
}
