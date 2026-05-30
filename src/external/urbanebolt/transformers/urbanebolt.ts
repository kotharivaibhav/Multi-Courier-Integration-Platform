import { ShipmentStatus } from '@prisma/client';
import { URBANEBOLT_STATUS_MAP } from '../constants/urbanebolt';
import {
  NormalizedCreateShipmentInput,
  NormalizedTrackingEvent,
} from '../../courier/adapter/courier-adapter';

interface UrbaneBoltManifestPayload {
  customerCode: string;
  orderNumber: string;
  declaredValue: number;
  itemDescription: string;
  collectableValue: number;
  height: number;
  length: number;
  pieces: number;
  weight: number;
  breadth: number;
  serviceType: string;
  payMode: string;
  rtnCity: string;
  rtnName: string;
  consCity: string;
  consName: string;
  rtnEmail?: string;
  rtnState: string;
  shprCity: string;
  shprName: string;
  consEmail?: string;
  consState: string;
  shprEmail?: string;
  shprState: string;
  rtnMobile: number | string;
  shprMobile: number | string;
  consMobile: number | string;
  rtnAddress: string;
  rtnAddressType?: string;
  rtnCountry: string;
  rtnPincode: number | string;
  consAddress: string;
  consAddressType?: string;
  consCountry: string;
  consPincode: number | string;
  shprAddress: string;
  shprAddressType?: string;
  shprCountry: string;
  shprPincode: number | string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceValue?: number;
  itemQuantity?: number;
}

function asUrbaneBoltNumeric(value: string | number): number | string {
  if (typeof value === 'number') {
    return value;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}

export function toUrbaneBoltManifestPayload(
  input: NormalizedCreateShipmentInput,
  customerCode: string,
): UrbaneBoltManifestPayload[] {
  const addr = (a: NormalizedCreateShipmentInput['shipper']) => ({
    name: a.name,
    email: a.email,
    city: a.city,
    state: a.state,
    mobile: a.mobile,
    address: a.address,
    country: a.country,
    pincode: a.pincode,
    addressType: a.addressType,
  });

  const shipper = addr(input.shipper);
  const consignee = addr(input.consignee);
  const rtn = addr(input.returnAddress);

  return [
    {
      customerCode,
      orderNumber: input.orderId,
      declaredValue: input.payment.declaredValue,
      itemDescription: input.package.description,
      collectableValue: input.payment.collectableValue,
      height: input.package.height,
      length: input.package.length,
      pieces: input.package.pieces,
      weight: input.package.weight,
      breadth: input.package.breadth,
      serviceType: input.serviceType ?? 'SDD',
      payMode: input.payment.mode,
      rtnCity: rtn.city,
      rtnName: rtn.name,
      consCity: consignee.city,
      consName: consignee.name,
      rtnEmail: rtn.email,
      rtnState: rtn.state,
      shprCity: shipper.city,
      shprName: shipper.name,
      consEmail: consignee.email,
      consState: consignee.state,
      shprEmail: shipper.email,
      shprState: shipper.state,
      rtnMobile: asUrbaneBoltNumeric(rtn.mobile),
      shprMobile: asUrbaneBoltNumeric(shipper.mobile),
      consMobile: asUrbaneBoltNumeric(consignee.mobile),
      rtnAddress: rtn.address,
      rtnAddressType: rtn.addressType ?? 'Seller',
      rtnCountry: rtn.country,
      rtnPincode: asUrbaneBoltNumeric(rtn.pincode),
      consAddress: consignee.address,
      consAddressType: consignee.addressType ?? 'Home',
      consCountry: consignee.country,
      consPincode: asUrbaneBoltNumeric(consignee.pincode),
      shprAddress: shipper.address,
      shprAddressType: shipper.addressType ?? 'Seller',
      shprCountry: shipper.country,
      shprPincode: asUrbaneBoltNumeric(shipper.pincode),
      invoiceNumber: input.invoice?.number,
      invoiceDate: input.invoice?.date,
      invoiceValue: input.invoice?.value,
      itemQuantity: input.package.quantity ?? input.package.pieces,
    },
  ];
}

export function mapUrbaneBoltStatus(code: string): ShipmentStatus {
  const mapped = URBANEBOLT_STATUS_MAP[code?.toUpperCase()];
  if (mapped && isShipmentStatus(mapped)) {
    return mapped;
  }
  return ShipmentStatus.IN_TRANSIT;
}

function isShipmentStatus(value: string): value is ShipmentStatus {
  return Object.values(ShipmentStatus).includes(value as ShipmentStatus);
}

export function mapUrbaneBoltScans(
  scans: Array<{
    statusDateTime: string;
    statusCode: string;
    statusCodeDescription: string;
    currentLocation?: string;
  }>,
): NormalizedTrackingEvent[] {
  return scans.map((scan) => ({
    status: mapUrbaneBoltStatus(scan.statusCode),
    statusCode: scan.statusCode,
    description: scan.statusCodeDescription,
    location: scan.currentLocation,
    eventAt: scan.statusDateTime,
  }));
}
