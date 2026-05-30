import { ShipmentStatus } from '@prisma/client';
import {
  CourierAdapter,
  NormalizedCancelResult,
  NormalizedCreateShipmentInput,
  NormalizedCreateShipmentResult,
  NormalizedTrackResult,
} from '../../courier/adapter/courier-adapter';
import { COURIER_PARTNER_CODES } from '../../courier/constants/partners';
import { MockCourierConfig } from '../../../config/schema';

export class MockCourierAdapter implements CourierAdapter {
  readonly partnerCode = COURIER_PARTNER_CODES.MOCK;
  private readonly config: MockCourierConfig;
  private readonly store = new Map<
    string,
    {
      input: NormalizedCreateShipmentInput;
      awb: string;
      status: ShipmentStatus;
    }
  >();

  constructor(config: MockCourierConfig) {
    this.config = config;
  }

  async createShipment(
    input: NormalizedCreateShipmentInput,
  ): Promise<NormalizedCreateShipmentResult> {
    await this.delay();
    const awb = `MOCK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const rawResponse = { status: 'Success', awbNumber: awb, mock: true };

    this.store.set(awb, {
      input,
      awb,
      status: ShipmentStatus.CREATED,
    });

    return {
      courierOrderId: input.orderId,
      awbNumber: awb,
      status: ShipmentStatus.CREATED,
      labelUrl: `https://mock-courier.local/labels/${awb}`,
      routeCode: 'MOCK/ROUTE',
      rawRequest: input,
      rawResponse,
    };
  }

  async trackShipment(awbNumber: string): Promise<NormalizedTrackResult> {
    await this.delay();
    const record = this.store.get(awbNumber);
    if (!record) {
      throw new Error('Mock shipment not found');
    }

    const rawResponse = { status: 'Success', awb: awbNumber, mock: true };
    return {
      awbNumber,
      courierOrderId: record.input.orderId,
      currentStatus: record.status,
      currentStatusDescription: `Mock status: ${record.status}`,
      currentLocation: 'Mock Hub',
      events: [
        {
          status: ShipmentStatus.CREATED,
          statusCode: 'MAN',
          description: 'Shipment Manifested',
          location: 'Mock Hub',
          eventAt: new Date().toISOString(),
        },
      ],
      rawResponse,
    };
  }

  async cancelShipment(
    awbNumber: string,
    courierOrderId?: string,
  ): Promise<NormalizedCancelResult> {
    await this.delay();
    const record = this.store.get(awbNumber);
    if (record) {
      record.status = ShipmentStatus.CANCELLED;
    }

    const rawResponse = { status: 'Success', message: 'Cancelled', mock: true };
    return {
      awbNumber,
      courierOrderId: courierOrderId ?? record?.input.orderId ?? '',
      status: ShipmentStatus.CANCELLED,
      message: 'Cancelled',
      rawRequest: { awbs: awbNumber },
      rawResponse,
    };
  }

  private delay(): Promise<void> {
    if (this.config.simulatedDelayMs <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) =>
      setTimeout(resolve, this.config.simulatedDelayMs),
    );
  }
}
