import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodObject } from 'zod';
import { AppContext } from '../../../../bootstrap/app-context';
import { HEADERS } from '../../../../base/headers/constants';
import { ResponseBuilder } from '../../../../pkg/httpresponse/response';
import { ErrValidation } from '../../../../pkg/httpresponse/api-errors';

export interface ValidationSchemas {
  headers: ZodObject<any>;
  params?: ZodObject<any>;
  body?: ZodType;
  query?: ZodType;
}

export const validateRequestInterceptor = (
  appContext: AppContext,
  schemas: ValidationSchemas,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const log = appContext.logger.child({
      requestId: req.headers[HEADERS.X_REQUEST_ID],
      path: req.path,
      method: req.method,
    });

    const resp = new ResponseBuilder();

    try {
      const headersResult = schemas.headers.safeParse(req.headers);
      if (!headersResult.success) {
        const message = headersResult.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        log.error({ errors: headersResult.error.errors }, 'Headers validation failed');
        resp.setApiError(new ErrValidation(`Invalid headers - ${message}`)).build(res);
        return;
      }

      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          const message = paramsResult.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
          resp.setApiError(new ErrValidation(`Invalid params - ${message}`)).build(res);
          return;
        }
      }

      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          const message = queryResult.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
          resp.setApiError(new ErrValidation(`Invalid query - ${message}`)).build(res);
          return;
        }
        req.query = queryResult.data;
      }

      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          const message = bodyResult.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ');
          resp.setApiError(new ErrValidation(`Invalid body - ${message}`)).build(res);
          return;
        }
        req.body = bodyResult.data;
      }

      next();
    } catch (error) {
      log.error({ error }, 'Request validation failed');
      resp.setApiError(new ErrValidation('Invalid request')).build(res);
    }
  };
};
