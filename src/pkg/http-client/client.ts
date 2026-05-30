import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import pino from 'pino';
import Logger = pino.Logger;

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  retryCount: number;
  retryBackoffMs: number;
  logger: Logger;
}

export interface HttpRequestOptions {
  method: Method;
  path: string;
  data?: unknown;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly options: HttpClientOptions;

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  async request<T>(opts: HttpRequestOptions): Promise<T> {
    const url = `${this.options.baseUrl}${opts.path}`;
    const config: AxiosRequestConfig = {
      method: opts.method,
      url,
      data: opts.data,
      params: opts.params,
      headers: opts.headers,
      timeout: this.options.timeoutMs,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.options.retryCount; attempt++) {
      const start = Date.now();
      try {
        const response = await axios.request<T>(config);
        this.options.logger.debug(
          { url, status: response.status, durationMs: Date.now() - start },
          'HTTP request succeeded',
        );
        return response.data;
      } catch (error) {
        lastError = error;
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const retryable =
          !status || status >= 500 || axiosError.code === 'ECONNABORTED';

        this.options.logger.warn(
          {
            url,
            attempt,
            status,
            durationMs: Date.now() - start,
            error: axiosError.message,
          },
          'HTTP request failed',
        );

        if (!retryable || attempt === this.options.retryCount) {
          throw error;
        }

        await sleep(this.options.retryBackoffMs * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function getHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}
