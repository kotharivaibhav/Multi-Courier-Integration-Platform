import { NextFunction, Request, Response } from 'express';
import { AppContext } from '../../bootstrap/app-context';
import { HEADERS } from '../../base/headers/constants';

export function loggerMiddleware(ctx: AppContext) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/api/v1/health') {
      return next();
    }

    const start = Date.now();
    const sanitizedBody = sanitizeRequestBody(req.body);

    ctx.logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        req_id: req.headers[HEADERS.X_REQUEST_ID],
        body: sanitizedBody,
      },
      'Request received',
    );

    res.on('finish', () => {
      ctx.logger.info(
        {
          method: req.method,
          url: req.originalUrl,
          status_code: res.statusCode,
          duration: Date.now() - start,
        },
        'Response sent',
      );
    });

    next();
  };
}

function sanitizeRequestBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const sanitized = { ...(body as Record<string, unknown>) };
  for (const field of ['password', 'token', 'secret']) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
