import { ShipmentReadRepository } from './shipment-read';
import { MysqlClient } from '../../../pkg/mysql/client';
import {
  BulkBatch,
  ShipmentOrder,
  ShipmentTrackingHistory,
} from '@prisma/client';

export class ShipmentReadRepositoryImpl implements ShipmentReadRepository {
  private db: MysqlClient;

  constructor(db: MysqlClient) {
    this.db = db;
  }

  async findByOrderId(orderId: string): Promise<ShipmentOrder | null> {
    return this.db.client.shipmentOrder.findUnique({ where: { orderId } });
  }

  async findByAwbNumber(awbNumber: string): Promise<ShipmentOrder | null> {
    return this.db.client.shipmentOrder.findFirst({ where: { awbNumber } });
  }

  async findBulkBatch(batchId: string): Promise<BulkBatch | null> {
    return this.db.client.bulkBatch.findUnique({ where: { id: batchId } });
  }

  async listTrackingHistory(
    shipmentId: number,
  ): Promise<ShipmentTrackingHistory[]> {
    return this.db.client.shipmentTrackingHistory.findMany({
      where: { shipmentId },
      orderBy: { eventAt: 'asc' },
    });
  }
}
