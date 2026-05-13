import { Channel } from 'amqplib';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export class TransactionEventConsumer {
  private readonly queueName = 'notification.transaction.created';
  private readonly deadLetterQueueName = 'notification.transaction.created.dlq';
  private readonly exchangeName = 'portfolio.events';
  private readonly routingKey = 'transaction.created';
  private readonly deadLetterExchange = 'portfolio.dlx';

  constructor(
    private channel: Channel,
    private notificationService: NotificationService
  ) {}

  async start(): Promise<void> {
    await this.channel.assertExchange(this.deadLetterExchange, 'direct', {
      durable: true
    });

    await this.channel.assertQueue(this.deadLetterQueueName, {
      durable: true
    });

    await this.channel.bindQueue(
      this.deadLetterQueueName,
      this.deadLetterExchange,
      this.queueName
    );

    await this.channel.assertQueue(this.queueName, {
      durable: true,
      deadLetterExchange: this.deadLetterExchange,
      deadLetterRoutingKey: this.queueName
    });

    await this.channel.bindQueue(
      this.queueName,
      this.exchangeName,
      this.routingKey
    );

    this.channel.prefetch(1);

    this.channel.consume(this.queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        logger.info('Received event', { eventId: event.eventId });

        await this.notificationService.processTransactionEvent(event.data);

        this.channel.ack(msg);
      } catch (error) {
        logger.error('Error processing message', { error });
        this.channel.nack(msg, false, false);
      }
    });

    logger.info('Transaction event consumer started');
  }
}
