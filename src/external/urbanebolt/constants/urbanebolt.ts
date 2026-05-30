export const URBANEBOLT_PATHS = {
  AUTH: '/api/v1/auth/getToken/',
  MANIFEST: '/api/v1/services/manifest/',
  TRACKING: '/api/v1/services/tracking-pub/',
  CANCEL: '/api/v1/services/cancel/',
} as const;

export const URBANEBOLT_STATUS_MAP: Record<string, string> = {
  MAN: 'CREATED',
  PKD: 'PICKED_UP',
  PUP: 'PICKED_UP',
  INT: 'IN_TRANSIT',
  IT: 'IN_TRANSIT',
  OFD: 'OUT_FOR_DELIVERY',
  DLV: 'DELIVERED',
  CAN: 'CANCELLED',
  RTO: 'RTO',
  FLD: 'FAILED',
};
