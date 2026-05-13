import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { logger } from '../utils/logger';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.transactionService.createTransaction({
        ...req.body,
        idempotencyKey: req.headers['idempotency-key'] as string
      });

      logger.info('Transaction created successfully', {
        transactionId: transaction.id,
        userId: transaction.userId
      });

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  };

  getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const transactions = await this.transactionService.getUserTransactions(userId);

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };

  getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawLimit = Number(req.query.limit ?? 10);
      const limit = Number.isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 50);
      const transactions = await this.transactionService.getRecentTransactions(limit);

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };
}
