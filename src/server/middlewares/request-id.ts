import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HEADERS } from '../../base/headers/constants';

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers[HEADERS.X_REQUEST_ID] as string) || uuidv4();
    req.headers[HEADERS.X_REQUEST_ID] = requestId;
    res.setHeader(HEADERS.X_REQUEST_ID, requestId);
    next();
  };
}
