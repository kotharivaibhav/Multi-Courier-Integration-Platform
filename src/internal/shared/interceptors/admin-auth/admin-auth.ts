import { NextFunction, Request, Response } from 'express';
import { AppContext } from '../../../../bootstrap/app-context';
import { HEADERS } from '../../../../base/headers/constants';
import { ResponseBuilder } from '../../../../pkg/httpresponse/response';
import { ErrUnauthorized } from '../../../../pkg/httpresponse/api-errors';
import { verifyAdminToken } from '../../../../pkg/jwt/token';
import { UserStatus } from '@prisma/client';

export const adminAuthInterceptor = (appContext: AppContext) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const resp = new ResponseBuilder();
    const log = appContext.logger.child({
      requestId: req.headers[HEADERS.X_REQUEST_ID],
      path: req.path,
      method: req.method,
    });

    const authHeader = req.headers[HEADERS.AUTHORIZATION];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      resp
        .setApiError(new ErrUnauthorized('Missing or invalid token'))
        .build(res);
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      resp
        .setApiError(new ErrUnauthorized('Missing or invalid token'))
        .build(res);
      return;
    }

    try {
      const payload = verifyAdminToken(token, appContext.config.auth.jwtSecret);
      const user = await appContext.userService.getActiveUserById(
        payload.userId,
      );

      if (user.email !== payload.email) {
        resp.setApiError(new ErrUnauthorized('Invalid token')).build(res);
        return;
      }

      if (user.status !== UserStatus.ACTIVE) {
        resp
          .setApiError(new ErrUnauthorized('Account is not active'))
          .build(res);
        return;
      }

      req.adminUser = user;
      next();
    } catch (error) {
      log.warn({ error }, 'Admin auth failed');
      resp
        .setApiError(new ErrUnauthorized('Invalid or expired token'))
        .build(res);
    }
  };
};
