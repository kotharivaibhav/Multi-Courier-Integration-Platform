import { NextFunction, Request, Response } from 'express';

export interface ShipmentController {
  createShipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  trackShipment(req: Request, res: Response, next: NextFunction): Promise<void>;
  cancelShipment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  bulkCreateShipments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  getBulkBatchStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  listCouriers(req: Request, res: Response, next: NextFunction): Promise<void>;
  handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
}
