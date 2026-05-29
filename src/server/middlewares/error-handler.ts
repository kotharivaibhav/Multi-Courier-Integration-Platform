import { NextFunction, Request, Response } from 'express';
import { AppContext } from '../../bootstrap/app-context';
import { ResponseBuilder } from '../../pkg/httpresponse/response';
import { HEADERS } from '../../base/headers/constants';
import { ErrInternalServer } from '../../pkg/httpresponse/api-errors';

export function errorHandlerMiddleware(ctx: AppContext) {
  return (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(error);
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    ctx.logger.error(
      {
        error: errorObj.message,
        stack: errorObj.stack,
        requestId: req.headers[HEADERS.X_REQUEST_ID],
        url: req.originalUrl,
        method: req.method,
      },
      'Internal server error',
    );

    return new ResponseBuilder().setApiError(new ErrInternalServer()).build(res);
  };
}
