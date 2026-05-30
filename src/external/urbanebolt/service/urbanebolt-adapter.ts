import pino from 'pino';
import { UrbaneBoltConfig } from '../../../config/schema';
import {
  HttpClient,
  getHttpStatus,
  isAxiosError,
} from '../../../pkg/http-client/client';
import {
  CourierAdapter,
  NormalizedCancelResult,
  NormalizedCreateShipmentInput,
  NormalizedCreateShipmentResult,
  NormalizedTrackResult,
} from '../../courier/adapter/courier-adapter';
import { COURIER_PARTNER_CODES } from '../../courier/constants/partners';
import { URBANEBOLT_PATHS } from '../constants/urbanebolt';
import {
  mapUrbaneBoltScans,
  mapUrbaneBoltStatus,
  toUrbaneBoltManifestPayload,
} from '../transformers/urbanebolt';
import { ShipmentStatus } from '@prisma/client';
import { ErrCourierApi } from '../../../pkg/httpresponse/api-errors';
import { ErrorCode } from '../../../pkg/httpresponse/error-codes';
import { StatusCodes } from 'http-status-codes';
import Logger = pino.Logger;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  expires: string;
  status: string;
}

interface ManifestSuccessItem {
  orderNumber: string;
  awbNumber: number | string;
  shippingLabel?: string;
  routeCode?: string;
  status: string;
}

interface ManifestResponse {
  status: string;
  successResponse: ManifestSuccessItem[];
  errorResponse: Array<{ orderNumber: string; message: string }>;
}

interface TrackingResponse {
  status: string;
  data: {
    awbNumber: number | string;
    orderNumber: string;
    currentStatusCode: string;
    currentStatusCodeDescription: string;
    currentLocation?: string;
    scans: Array<{
      statusDateTime: string;
      statusCode: string;
      statusCodeDescription: string;
      currentLocation?: string;
    }>;
  };
}

interface CancelResponse {
  status: string;
  successResponse: Array<{
    orderNumber: string;
    awb: string;
    message: string;
  }>;
  failureResponse: Array<{ awb: string; message: string }>;
}

export class UrbaneBoltAdapter implements CourierAdapter {
  readonly partnerCode = COURIER_PARTNER_CODES.URBANEBOLT;
  private readonly config: UrbaneBoltConfig;
  private readonly httpClient: HttpClient;
  private readonly logger: Logger;
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: UrbaneBoltConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      retryCount: config.retryCount,
      retryBackoffMs: config.retryBackoffMs,
      logger,
    });
  }

  async createShipment(
    input: NormalizedCreateShipmentInput,
  ): Promise<NormalizedCreateShipmentResult> {
    const payload = toUrbaneBoltManifestPayload(
      input,
      this.config.customerCode,
    );
    const rawRequest = payload;

    const execute = async (
      retryOnAuth = true,
    ): Promise<NormalizedCreateShipmentResult> => {
      try {
        const token = await this.getToken(retryOnAuth);
        const response = await this.httpClient.request<ManifestResponse>({
          method: 'POST',
          path: URBANEBOLT_PATHS.MANIFEST,
          data: payload,
          headers: this.buildAuthorizedHeaders(token),
        });

        if (response.errorResponse?.length) {
          throw new ErrCourierApi(
            ErrorCode.COURIER_CLIENT_ERROR,
            response.errorResponse[0].message,
            StatusCodes.BAD_GATEWAY,
          );
        }

        const item = response.successResponse?.[0];
        if (!item) {
          throw new ErrCourierApi(
            ErrorCode.COURIER_SERVER_ERROR,
            'Empty response from courier',
            StatusCodes.BAD_GATEWAY,
          );
        }

        return {
          courierOrderId: item.orderNumber,
          awbNumber: String(item.awbNumber),
          status: ShipmentStatus.CREATED,
          labelUrl: item.shippingLabel,
          routeCode: item.routeCode,
          rawRequest,
          rawResponse: response,
        };
      } catch (error) {
        if (retryOnAuth && this.isAuthError(error)) {
          this.token = null;
          return execute(false);
        }
        throw this.mapError(error);
      }
    };

    return execute();
  }

  async trackShipment(awbNumber: string): Promise<NormalizedTrackResult> {
    const execute = async (
      retryOnAuth = true,
    ): Promise<NormalizedTrackResult> => {
      try {
        const token = await this.getToken(retryOnAuth);
        const response = await this.httpClient.request<TrackingResponse>({
          method: 'GET',
          path: URBANEBOLT_PATHS.TRACKING,
          params: { awb: awbNumber },
          headers: this.buildAuthorizedHeaders(token),
        });

        const data = response.data;
        const events = mapUrbaneBoltScans(data.scans ?? []);

        return {
          awbNumber: String(data.awbNumber),
          courierOrderId: data.orderNumber,
          currentStatus: mapUrbaneBoltStatus(data.currentStatusCode),
          currentStatusDescription: data.currentStatusCodeDescription,
          currentLocation: data.currentLocation,
          events,
          rawResponse: response,
        };
      } catch (error) {
        if (retryOnAuth && this.isAuthError(error)) {
          this.token = null;
          return execute(false);
        }
        throw this.mapError(error);
      }
    };

    return execute();
  }

  async cancelShipment(
    awbNumber: string,
    courierOrderId?: string,
  ): Promise<NormalizedCancelResult> {
    const rawRequest = { awbs: awbNumber };

    const execute = async (
      retryOnAuth = true,
    ): Promise<NormalizedCancelResult> => {
      try {
        const token = await this.getToken(retryOnAuth);
        const response = await this.httpClient.request<CancelResponse>({
          method: 'POST',
          path: URBANEBOLT_PATHS.CANCEL,
          data: rawRequest,
          headers: this.buildAuthorizedHeaders(token),
        });

        if (response.failureResponse?.length) {
          throw new ErrCourierApi(
            ErrorCode.COURIER_CLIENT_ERROR,
            response.failureResponse[0].message,
            StatusCodes.BAD_GATEWAY,
          );
        }

        const item = response.successResponse?.[0];
        return {
          awbNumber,
          courierOrderId: item?.orderNumber ?? courierOrderId ?? '',
          status: ShipmentStatus.CANCELLED,
          message: item?.message ?? 'Cancelled',
          rawRequest,
          rawResponse: response,
        };
      } catch (error) {
        if (retryOnAuth && this.isAuthError(error)) {
          this.token = null;
          return execute(false);
        }
        throw this.mapError(error);
      }
    };

    return execute();
  }

  private buildCookieHeader(): string | undefined {
    const cookies: string[] = [];
    if (this.config.csrfToken) {
      cookies.push(`csrftoken=${this.config.csrfToken}`);
    }
    if (this.config.sessionId) {
      cookies.push(`sessionid=${this.config.sessionId}`);
    }
    return cookies.length > 0 ? cookies.join('; ') : undefined;
  }

  private buildAuthorizedHeaders(token: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const cookie = this.buildCookieHeader();
    if (cookie) {
      headers.Cookie = cookie;
    }
    return headers;
  }

  private async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const cookie = this.buildCookieHeader();
    if (cookie) {
      headers.Cookie = cookie;
    }

    const response = await this.httpClient.request<TokenResponse>({
      method: 'POST',
      path: URBANEBOLT_PATHS.AUTH,
      data: {
        username: this.config.username,
        password: this.config.password,
      },
      headers,
    });

    this.token = response.access_token;
    this.tokenExpiresAt = Date.now() + (response.expires_in - 60) * 1000;
    return this.token;
  }

  private isAuthError(error: unknown): boolean {
    const status = getHttpStatus(error);
    return status === 401 || status === 403;
  }

  private mapError(error: unknown): ErrCourierApi {
    if (error instanceof ErrCourierApi) {
      return error;
    }

    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return new ErrCourierApi(
          ErrorCode.COURIER_AUTH_ERROR,
          'Courier authentication failed',
          StatusCodes.BAD_GATEWAY,
        );
      }
      if (status && status >= 400 && status < 500) {
        return new ErrCourierApi(
          ErrorCode.COURIER_CLIENT_ERROR,
          'Courier rejected the request',
          StatusCodes.BAD_GATEWAY,
        );
      }
      if (error.code === 'ECONNABORTED') {
        return new ErrCourierApi(
          ErrorCode.COURIER_TIMEOUT,
          'Courier request timed out',
          StatusCodes.GATEWAY_TIMEOUT,
        );
      }
    }

    return new ErrCourierApi(
      ErrorCode.COURIER_SERVER_ERROR,
      'Courier service unavailable',
      StatusCodes.BAD_GATEWAY,
    );
  }
}
