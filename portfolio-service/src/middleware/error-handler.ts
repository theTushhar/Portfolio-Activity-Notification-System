import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error & { statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};
