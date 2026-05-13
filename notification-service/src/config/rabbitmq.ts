import * as amqp from 'amqplib';
import { logger } from '../utils/logger';

export class RabbitMQConnection {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;
  private readonly exchangeName = 'portfolio.events';
  private readonly retryDelayMs = 5000;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    while (!this.channel) {
      try {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(this.exchangeName, 'topic', {
          durable: true
        });

        logger.info('Connected to RabbitMQ');
      } catch (error) {
        logger.error('RabbitMQ connection error', error);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }
  }

  async publishEvent(routingKey: string, message: object): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(
      this.exchangeName,
      routingKey,
      messageBuffer,
      { persistent: true }
    );

    logger.info('Event published', { routingKey, message });
  }

  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    return this.channel;
  }
}
