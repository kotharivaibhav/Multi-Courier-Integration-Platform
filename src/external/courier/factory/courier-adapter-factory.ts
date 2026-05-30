import { CourierAdapter } from '../adapter/courier-adapter';
import { ErrUnknownCourier } from '../../../pkg/httpresponse/api-errors';

export class CourierAdapterFactory {
  private readonly adapters: Map<string, CourierAdapter>;

  constructor(adapters: CourierAdapter[]) {
    this.adapters = new Map(
      adapters.map((adapter) => [adapter.partnerCode.toLowerCase(), adapter]),
    );
  }

  getAdapter(partnerCode: string): CourierAdapter {
    const adapter = this.adapters.get(partnerCode.toLowerCase());
    if (!adapter) {
      throw new ErrUnknownCourier(this.getSupportedPartners());
    }
    return adapter;
  }

  getSupportedPartners(): string[] {
    return Array.from(this.adapters.keys()).sort();
  }

  hasPartner(partnerCode: string): boolean {
    return this.adapters.has(partnerCode.toLowerCase());
  }
}
