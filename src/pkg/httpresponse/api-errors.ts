import { StatusCodes } from 'http-status-codes';
import { AppAPIError } from './app-api-err';

export class ErrNotFound extends AppAPIError {
  readonly status = StatusCodes.NOT_FOUND;

  constructor(msg = 'Resource not found', result?: unknown) {
    super(msg, result);
    Object.setPrototypeOf(this, ErrNotFound.prototype);
  }
}

export class ErrValidation extends AppAPIError {
  readonly status = StatusCodes.BAD_REQUEST;

  constructor(message = 'Validation failed', result?: unknown) {
    super(message, result);
    Object.setPrototypeOf(this, ErrValidation.prototype);
  }
}

export class ErrConflict extends AppAPIError {
  readonly status = StatusCodes.CONFLICT;

  constructor(message = 'Resource already exists', result?: unknown) {
    super(message, result);
    Object.setPrototypeOf(this, ErrConflict.prototype);
  }
}

export class ErrInternalServer extends AppAPIError {
  readonly status = StatusCodes.INTERNAL_SERVER_ERROR;

  constructor(message = 'Internal server error', result?: unknown) {
    super(message, result);
    Object.setPrototypeOf(this, ErrInternalServer.prototype);
  }
}
