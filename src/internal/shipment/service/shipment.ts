import { CreateShipmentRequest } from '../dto/request';
import {
  BulkShipmentResponseDto,
  CancelShipmentResponseDto,
  CouriersListResponseDto,
  ShipmentResponseDto,
  TrackShipmentResponseDto,
} from '../dto/response';

export interface ShipmentService {
  createShipment(
    request: CreateShipmentRequest,
    requestId?: string,
  ): Promise<ShipmentResponseDto>;
  trackShipment(
    orderId: string,
    requestId?: string,
  ): Promise<TrackShipmentResponseDto>;
  cancelShipment(
    orderId: string,
    requestId?: string,
  ): Promise<CancelShipmentResponseDto>;
  bulkCreateShipments(
    orders: CreateShipmentRequest[],
    requestId?: string,
  ): Promise<{ batchId: string }>;
  getBulkBatchStatus(batchId: string): Promise<BulkShipmentResponseDto>;
  listCouriers(): Promise<CouriersListResponseDto>;
  handleWebhook(
    courierPartner: string,
    payload: Record<string, unknown>,
    requestId?: string,
  ): Promise<void>;
}
