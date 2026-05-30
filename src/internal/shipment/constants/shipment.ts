export const SHIPMENT_MESSAGES = {
  CREATED: 'Shipment created successfully',
  TRACKED: 'Tracking fetched successfully',
  CANCELLED: 'Shipment cancelled successfully',
  BATCH_ACCEPTED: 'Bulk shipment batch accepted for processing',
  BATCH_STATUS: 'Bulk batch status fetched',
  COURIERS_LIST: 'Supported couriers fetched',
  NOT_FOUND: 'Shipment not found',
  BATCH_NOT_FOUND: 'Batch not found',
  NOT_CANCELLABLE: 'Shipment cannot be cancelled in current status',
  IDEMPOTENT_RETURN: 'Shipment already exists — returning existing record',
} as const;
