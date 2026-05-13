import { v4 as uuidv4 } from 'uuid';
import { RabbitMQConnection } from '../config/rabbitmq';
import { PortfolioTransactionCreatedEvent } from '../events/portfolio.events';
import { Transaction } from '../models/transaction.entity';

export class EventPublisherService {
  constructor(private rabbitMQ: RabbitMQConnection) {}

  async publishTransactionCreated(transaction: Transaction): Promise<void> {
    const event: PortfolioTransactionCreatedEvent = {
      eventType: 'PortfolioTransactionCreated',
      eventId: uuidv4(),
      timestamp: new Date(),
      data: {
        transactionId: transaction.id,
        userId: transaction.userId,
        assetSymbol: transaction.assetSymbol,
        type: transaction.type,
        quantity: Number(transaction.quantity),
        price: Number(transaction.price),
        totalValue: Number(transaction.quantity) * Number(transaction.price)
      }
    };

    await this.rabbitMQ.publishEvent(
      'transaction.created',
      event
    );
  }
}
