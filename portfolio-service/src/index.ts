import express from 'express';
import { AppDataSource } from './config/database';
import { RabbitMQConnection } from './config/rabbitmq';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { EventPublisherService } from './services/event-publisher.service';
import { Transaction } from './models/transaction.entity';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'portfolio-service' });
});

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

    const rabbitMQ = new RabbitMQConnection(
      process.env.RABBITMQ_URL
    );
    await rabbitMQ.connect();

    const transactionRepository = AppDataSource.getRepository(Transaction);
    const eventPublisher = new EventPublisherService(rabbitMQ);
    const transactionService = new TransactionService(transactionRepository, eventPublisher);
    const transactionController = new TransactionController(transactionService);

    app.post('/api/transactions', transactionController.createTransaction);
    app.get('/api/transactions/user/:userId', transactionController.getUserTransactions);
    app.get('/api/transactions/recent', transactionController.getRecentTransactions);

    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Portfolio service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
}

bootstrap();
