import express from 'express';
import { AppDataSource } from './config/database';
import { RabbitMQConnection } from './config/rabbitmq';
import { RedisConnection } from './config/redis';
import { TransactionEventConsumer } from './consumers/transaction-event.consumer';
import { NotificationService } from './services/notification.service';
import { PreferenceService } from './services/preference.service';
import { EmailService } from './services/email.service';
import { Notification } from './models/notification.entity';
import { UserPreference } from './models/user-preference.entity';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

async function waitForRabbitChannel(rabbitMQ: RabbitMQConnection): Promise<void> {
  while (true) {
    try {
      rabbitMQ.getChannel();
      return;
    } catch {
      logger.warn('Waiting for RabbitMQ channel...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function bootstrap() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is required');
    }
    await AppDataSource.initialize();
    logger.info('Database connected');

    const hasRedisConfig = Boolean(process.env.REDIS_URL && process.env.REDIS_TOKEN);
    const redis = hasRedisConfig
      ? new RedisConnection(process.env.REDIS_URL as string, process.env.REDIS_TOKEN as string)
      : undefined;
    if (!hasRedisConfig) {
      logger.warn('REDIS_URL/REDIS_TOKEN not set. Running without cache.');
    }

    const rabbitMQ = new RabbitMQConnection(
      process.env.RABBITMQ_URL
    );
    await rabbitMQ.connect();
    await waitForRabbitChannel(rabbitMQ);

    const notificationRepository = AppDataSource.getRepository(Notification);
    const preferenceRepository = AppDataSource.getRepository(UserPreference);

    const emailService = new EmailService();
    const preferenceService = new PreferenceService(preferenceRepository, redis);
    const notificationService = new NotificationService(
      notificationRepository,
      preferenceService,
      emailService
    );

    const consumer = new TransactionEventConsumer(
      rabbitMQ.getChannel(),
      notificationService
    );
    await consumer.start();

    app.get('/api/preferences/:userId', async (req, res) => {
      try {
        const preference = await preferenceService.getUserPreference(req.params.userId as string);
        res.json({ success: true, data: preference });
      } catch (error) {
        logger.error('Failed to fetch preference', { error });
        res.status(500).json({ success: false, error: 'Failed to fetch preference' });
      }
    });

    app.put('/api/preferences/:userId', async (req, res) => {
      try {
        const preference = await preferenceService.updatePreference(
          req.params.userId as string,
          req.body
        );
        res.json({ success: true, data: preference });
      } catch (error) {
        logger.error('Failed to update preference', { error });
        res.status(500).json({ success: false, error: 'Failed to update preference' });
      }
    });

    app.get('/api/recent', async (req, res) => {
      try {
        const rawLimit = Number(req.query.limit ?? 10);
        const limit = Number.isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 50);
        const notifications = await notificationRepository.find({
          order: { createdAt: 'DESC' },
          take: limit
        });

        res.json({ success: true, data: notifications });
      } catch (error) {
        logger.error('Failed to fetch notifications', { error });
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
      }
    });

    app.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
}

bootstrap();
