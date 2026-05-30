import {
  BulkBatch,
  ShipmentOrder,
  ShipmentTrackingHistory,
} from '@prisma/client';

export interface ShipmentReadRepository {
  findByOrderId(orderId: string): Promise<ShipmentOrder | null>;
  findByAwbNumber(awbNumber: string): Promise<ShipmentOrder | null>;
  findBulkBatch(batchId: string): Promise<BulkBatch | null>;
  listTrackingHistory(shipmentId: number): Promise<ShipmentTrackingHistory[]>;
}
