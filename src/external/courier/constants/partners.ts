export const COURIER_PARTNER_CODES = {
  URBANEBOLT: 'urbanebolt',
  MOCK: 'mock',
} as const;

export type CourierPartnerCode =
  (typeof COURIER_PARTNER_CODES)[keyof typeof COURIER_PARTNER_CODES];
