import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppAPIError } from './app-api-err';
import { format } from 'date-fns';
import { DateFormat } from '../date/format-constants';

interface BaseResponse<T = unknown> {
  status: number;
  message: string | null;
  result: T | null;
  time_stamp: string;
  error?: string | null;
}

export class ResponseBuilder {
  private customFields: Record<string, unknown> = {};
  private response: BaseResponse;
  private httpStatusCode: number;

  constructor() {
    this.response = {
      status: 1,
      message: null,
      result: null,
      time_stamp: format(new Date(), DateFormat.RFC3339_MILLI),
    };
    this.httpStatusCode = StatusCodes.OK;
  }

  setError(statusCode: number, message: string): ResponseBuilder {
    this.response.status = 0;
    this.response.message = message;
    this.response.result = null;
    this.httpStatusCode = statusCode;
    return this;
  }

  setApiError(error: AppAPIError): ResponseBuilder {
    this.response.status = 0;
    this.response.message = error.message;
    this.response.error = error.message;
    this.httpStatusCode = error.getStatus();

    if (error.getResult()) {
      this.response.result = error.getResult();
    }

    return this;
  }

  setResponse<T>(data: T): ResponseBuilder {
    this.response.status = 1;
    this.response.result = data;
    this.httpStatusCode = StatusCodes.OK;
    return this;
  }

  setMessage(message: string): ResponseBuilder {
    this.response.message = message;
    return this;
  }

  build(res: Response): void {
    this.response = {
      ...this.response,
      ...this.customFields,
    };
    res.status(this.httpStatusCode).json(this.response);
  }
}

export function newResponseBuilder(): ResponseBuilder {
  return new ResponseBuilder();
}
