import { ShipmentStatus } from '@prisma/client';

export interface NormalizedAddress {
  name: string;
  email?: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType?: string;
}

export interface NormalizedPackage {
  weight: number;
  length: number;
  breadth: number;
  height: number;
  pieces: number;
  description: string;
  quantity?: number;
}

export interface NormalizedPayment {
  mode: 'COD' | 'PREPAID';
  collectableValue: number;
  declaredValue: number;
}

export interface NormalizedInvoice {
  number: string;
  date: string;
  value: number;
}

export interface NormalizedCreateShipmentInput {
  orderId: string;
  serviceType?: string;
  shipper: NormalizedAddress;
  consignee: NormalizedAddress;
  returnAddress: NormalizedAddress;
  package: NormalizedPackage;
  payment: NormalizedPayment;
  invoice?: NormalizedInvoice;
}

export interface NormalizedCreateShipmentResult {
  courierOrderId: string;
  awbNumber: string;
  status: ShipmentStatus;
  labelUrl?: string;
  routeCode?: string;
  rawRequest: unknown;
  rawResponse: unknown;
}

export interface NormalizedTrackingEvent {
  status: ShipmentStatus;
  statusCode: string;
  description: string;
  location?: string;
  eventAt: string;
}

export interface NormalizedTrackResult {
  awbNumber: string;
  courierOrderId: string;
  currentStatus: ShipmentStatus;
  currentStatusDescription: string;
  currentLocation?: string;
  events: NormalizedTrackingEvent[];
  rawResponse: unknown;
}

export interface NormalizedCancelResult {
  awbNumber: string;
  courierOrderId: string;
  status: ShipmentStatus;
  message: string;
  rawRequest: unknown;
  rawResponse: unknown;
}

export interface CourierAdapter {
  readonly partnerCode: string;
  createShipment(
    input: NormalizedCreateShipmentInput,
  ): Promise<NormalizedCreateShipmentResult>;
  trackShipment(awbNumber: string): Promise<NormalizedTrackResult>;
  cancelShipment(
    awbNumber: string,
    courierOrderId?: string,
  ): Promise<NormalizedCancelResult>;
}
