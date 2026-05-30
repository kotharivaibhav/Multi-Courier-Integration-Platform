import { StatusCodes } from 'http-status-codes';
import { AppAPIError } from './app-api-err';
import { ErrorCode, FieldError, NormalizedErrorDetail } from './error-codes';

export class ErrNotFound extends AppAPIError {
  readonly status = StatusCodes.NOT_FOUND;
  readonly errorCode = ErrorCode.ORDER_NOT_FOUND;

  constructor(msg = 'Resource not found', result?: unknown) {
    super(msg, result);
    Object.setPrototypeOf(this, ErrNotFound.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrValidation extends AppAPIError {
  readonly status = StatusCodes.BAD_REQUEST;
  readonly errorCode = ErrorCode.VALIDATION_ERROR;
  private fields: FieldError[] = [];

  constructor(message = 'Validation failed', fields?: FieldError[]) {
    super(message);
    this.fields = fields ?? [];
    Object.setPrototypeOf(this, ErrValidation.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode, fields: this.fields };
  }
}

export class ErrConflict extends AppAPIError {
  readonly status = StatusCodes.CONFLICT;
  readonly errorCode = ErrorCode.ORDER_ALREADY_EXISTS;

  constructor(message = 'Resource already exists', result?: unknown) {
    super(message, result);
    Object.setPrototypeOf(this, ErrConflict.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrUnknownCourier extends AppAPIError {
  readonly status = StatusCodes.BAD_REQUEST;
  readonly errorCode = ErrorCode.UNKNOWN_COURIER;

  constructor(supportedCouriers: string[]) {
    super(
      `Unknown courier partner. Supported: ${supportedCouriers.join(', ')}`,
      { supportedCouriers },
    );
    Object.setPrototypeOf(this, ErrUnknownCourier.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    const result = this.getResult() as { supportedCouriers?: string[] };
    return {
      code: this.errorCode,
      supportedCouriers: result?.supportedCouriers,
    };
  }
}

export class ErrCourierApi extends AppAPIError {
  readonly status: number;
  readonly errorCode: ErrorCode;

  constructor(
    errorCode: ErrorCode,
    message: string,
    status = StatusCodes.BAD_GATEWAY,
    result?: unknown,
  ) {
    super(message, result);
    this.errorCode = errorCode;
    this.status = status;
    Object.setPrototypeOf(this, ErrCourierApi.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrInternalServer extends AppAPIError {
  readonly status = StatusCodes.INTERNAL_SERVER_ERROR;
  readonly errorCode = ErrorCode.INTERNAL_ERROR;

  constructor(message = 'Internal server error', result?: unknown) {
    super(message, result);
    Object.setPrototypeOf(this, ErrInternalServer.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrUnauthorized extends AppAPIError {
  readonly status = StatusCodes.UNAUTHORIZED;
  readonly errorCode = ErrorCode.UNAUTHORIZED;

  constructor(message = 'Unauthorized') {
    super(message);
    Object.setPrototypeOf(this, ErrUnauthorized.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrInvalidCredentials extends AppAPIError {
  readonly status = StatusCodes.UNAUTHORIZED;
  readonly errorCode = ErrorCode.INVALID_CREDENTIALS;

  constructor(message = 'Invalid email or password') {
    super(message);
    Object.setPrototypeOf(this, ErrInvalidCredentials.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrUserNotFound extends AppAPIError {
  readonly status = StatusCodes.NOT_FOUND;
  readonly errorCode = ErrorCode.USER_NOT_FOUND;

  constructor(message = 'User not found') {
    super(message);
    Object.setPrototypeOf(this, ErrUserNotFound.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrEmailExists extends AppAPIError {
  readonly status = StatusCodes.CONFLICT;
  readonly errorCode = ErrorCode.EMAIL_EXISTS;

  constructor(message = 'Email already registered') {
    super(message);
    Object.setPrototypeOf(this, ErrEmailExists.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}

export class ErrMobileExists extends AppAPIError {
  readonly status = StatusCodes.CONFLICT;
  readonly errorCode = ErrorCode.MOBILE_EXISTS;

  constructor(message = 'Mobile number already registered') {
    super(message);
    Object.setPrototypeOf(this, ErrMobileExists.prototype);
  }

  getDetail(): NormalizedErrorDetail {
    return { code: this.errorCode };
  }
}
