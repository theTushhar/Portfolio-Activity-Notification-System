import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
}
