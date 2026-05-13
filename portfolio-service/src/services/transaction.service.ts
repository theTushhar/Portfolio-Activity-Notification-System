import { Repository } from 'typeorm';
import { Transaction, TransactionType } from '../models/transaction.entity';
import { EventPublisherService } from './event-publisher.service';
import { logger } from '../utils/logger';
import { HttpError } from '../utils/http-error';

export interface CreateTransactionDTO {
  userId: string;
  assetSymbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  idempotencyKey?: string;
}

export class TransactionService {
  constructor(
    private transactionRepository: Repository<Transaction>,
    private eventPublisher: EventPublisherService
  ) {}

  async createTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
    if (dto.idempotencyKey) {
      const existing = await this.transactionRepository.findOne({
        where: { idempotencyKey: dto.idempotencyKey }
      });

      if (existing) {
        logger.info('Duplicate request detected', { idempotencyKey: dto.idempotencyKey });
        return existing;
      }
    }

    this.validateTransaction(dto);

    const transaction = this.transactionRepository.create(dto);
    const savedTransaction = await this.transactionRepository.save(transaction);

    logger.info('Transaction created', { transactionId: savedTransaction.id });

    try {
      await this.eventPublisher.publishTransactionCreated(savedTransaction);
      logger.info('Transaction event published', { transactionId: savedTransaction.id });
    } catch (error) {
      logger.error('Failed to publish transaction event', { 
        error: (error as Error).message, 
        transactionId: savedTransaction.id 
      });
      // We don't throw here to ensure the transaction is still returned to the user
      // but the log will help identify issues
    }

    return savedTransaction;
  }

  private validateTransaction(dto: CreateTransactionDTO): void {
    if (!dto.userId || !dto.assetSymbol || !dto.type) {
      throw new HttpError(400, 'userId, assetSymbol and type are required');
    }
    if (typeof dto.quantity !== 'number' || Number.isNaN(dto.quantity) || dto.quantity <= 0) {
      throw new HttpError(400, 'Quantity must be a positive number');
    }
    if (typeof dto.price !== 'number' || Number.isNaN(dto.price) || dto.price <= 0) {
      throw new HttpError(400, 'Price must be a positive number');
    }
    if (!Object.values(TransactionType).includes(dto.type)) {
      throw new HttpError(400, 'Invalid transaction type. Allowed values: BUY, SELL');
    }
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    return this.transactionRepository.find({
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
}
