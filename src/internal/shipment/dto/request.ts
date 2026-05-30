import { z } from 'zod';
import { COURIER_PARTNER_CODES } from '../../../external/courier/constants/partners';

const AddressSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^[0-9]{10,15}$/),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().default('INDIA'),
  pincode: z.string().regex(/^[0-9]{6}$/),
  address_type: z.string().optional(),
});

const PackageSchema = z.object({
  weight: z.number().positive(),
  length: z.number().positive(),
  breadth: z.number().positive(),
  height: z.number().positive(),
  pieces: z.number().int().positive().default(1),
  description: z.string().min(1).max(255),
  quantity: z.number().int().positive().optional(),
});

const PaymentSchema = z.object({
  mode: z.enum(['COD', 'PREPAID']),
  collectable_value: z.number().min(0),
  declared_value: z.number().positive(),
});

const InvoiceSchema = z.object({
  number: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().positive(),
});

export const CreateShipmentSchema = z.object({
  order_id: z.string().min(1).max(100),
  courier_partner: z.string().min(1).max(50),
  service_type: z.string().optional(),
  shipper: AddressSchema,
  consignee: AddressSchema,
  return_address: AddressSchema,
  package: PackageSchema,
  payment: PaymentSchema,
  invoice: InvoiceSchema.optional(),
});

export const BulkCreateShipmentsSchema = z.object({
  orders: z.array(CreateShipmentSchema).min(1).max(100),
});

export const ShipmentIdParamSchema = z.object({
  order_id: z.string().min(1).max(100),
});

export const BatchIdParamSchema = z.object({
  batch_id: z.string().uuid(),
});

export const WebhookParamSchema = z.object({
  courier_partner: z.string().min(1).max(50),
});

export type CreateShipmentRequest = z.infer<typeof CreateShipmentSchema>;
export type BulkCreateShipmentsRequest = z.infer<
  typeof BulkCreateShipmentsSchema
>;

export const SUPPORTED_COURIERS = [
  COURIER_PARTNER_CODES.URBANEBOLT,
  COURIER_PARTNER_CODES.MOCK,
] as const;
