import { ShipmentOrder } from '@prisma/client';
import {
  CancelShipmentResponseDto,
  ShipmentResponseDto,
  TrackingEventDto,
  TrackShipmentResponseDto,
} from '../dto/response';
import { CreateShipmentRequest } from '../dto/request';
import {
  NormalizedAddress,
  NormalizedCreateShipmentInput,
} from '../../../external/courier/adapter/courier-adapter';

export function toNormalizedAddress(
  addr: CreateShipmentRequest['shipper'],
): NormalizedAddress {
  return {
    name: addr.name,
    email: addr.email,
    mobile: addr.mobile,
    address: addr.address,
    city: addr.city,
    state: addr.state,
    country: addr.country,
    pincode: addr.pincode,
    addressType: addr.address_type,
  };
}

export function toNormalizedCreateInput(
  request: CreateShipmentRequest,
): NormalizedCreateShipmentInput {
  return {
    orderId: request.order_id,
    serviceType: request.service_type,
    shipper: toNormalizedAddress(request.shipper),
    consignee: toNormalizedAddress(request.consignee),
    returnAddress: toNormalizedAddress(request.return_address),
    package: {
      weight: request.package.weight,
      length: request.package.length,
      breadth: request.package.breadth,
      height: request.package.height,
      pieces: request.package.pieces,
      description: request.package.description,
      quantity: request.package.quantity,
    },
    payment: {
      mode: request.payment.mode,
      collectableValue: request.payment.collectable_value,
      declaredValue: request.payment.declared_value,
    },
    invoice: request.invoice
      ? {
          number: request.invoice.number,
          date: request.invoice.date,
          value: request.invoice.value,
        }
      : undefined,
  };
}

export function transformShipmentToResponse(
  order: ShipmentOrder,
): ShipmentResponseDto {
  return {
    order_id: order.orderId,
    courier_partner: order.courierPartner,
    courier_order_id: order.courierOrderId,
    awb_number: order.awbNumber,
    status: order.status,
    label_url: order.labelUrl,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function transformTrackResponse(
  order: ShipmentOrder,
  currentDescription: string,
  currentLocation: string | null,
  events: TrackingEventDto[],
): TrackShipmentResponseDto {
  return {
    order_id: order.orderId,
    courier_partner: order.courierPartner,
    awb_number: order.awbNumber,
    current_status: order.status,
    current_status_description: currentDescription,
    current_location: currentLocation,
    events,
  };
}

export function transformCancelResponse(
  order: ShipmentOrder,
  message: string,
): CancelShipmentResponseDto {
  return {
    order_id: order.orderId,
    awb_number: order.awbNumber,
    status: order.status,
    message,
  };
}
