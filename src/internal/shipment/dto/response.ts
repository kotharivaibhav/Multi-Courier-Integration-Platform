import { ShipmentStatus } from '@prisma/client';

export interface ShipmentResponseDto {
  order_id: string;
  courier_partner: string;
  courier_order_id: string | null;
  awb_number: string | null;
  status: ShipmentStatus;
  label_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TrackingEventDto {
  status: ShipmentStatus;
  description: string | null;
  location: string | null;
  event_at: Date;
}

export interface TrackShipmentResponseDto {
  order_id: string;
  courier_partner: string;
  awb_number: string | null;
  current_status: ShipmentStatus;
  current_status_description: string;
  current_location: string | null;
  events: TrackingEventDto[];
}

export interface CancelShipmentResponseDto {
  order_id: string;
  awb_number: string | null;
  status: ShipmentStatus;
  message: string;
}

export interface BulkShipmentResultItem {
  order_id: string;
  success: boolean;
  data?: ShipmentResponseDto;
  error?: { code: string; message: string };
}

export interface BulkShipmentResponseDto {
  batch_id: string;
  status: string;
  total: number;
  success_count: number;
  failed_count: number;
  results?: BulkShipmentResultItem[];
}

export interface CouriersListResponseDto {
  couriers: string[];
}
