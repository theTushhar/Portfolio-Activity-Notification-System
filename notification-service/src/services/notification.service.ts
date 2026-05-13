import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../models/notification.entity';
import { EmailService } from './email.service';
import { PreferenceService } from './preference.service';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/retry';

export interface TransactionEventData {
  transactionId: string;
  userId: string;
  assetSymbol: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
}

export class NotificationService {
  private readonly MAX_RETRY_COUNT = 3;

  constructor(
    private notificationRepository: Repository<Notification>,
    private preferenceService: PreferenceService,
    private emailService: EmailService
  ) {}

  async processTransactionEvent(eventData: TransactionEventData): Promise<void> {
    logger.info('Processing transaction event', { 
      transactionId: eventData.transactionId,
      userId: eventData.userId 
    });

    const existing = await this.notificationRepository.findOne({
      where: { transactionId: eventData.transactionId }
    });

    if (existing) {
      logger.info('Notification already processed', { transactionId: eventData.transactionId });
      return;
    }

    // 1. Always create the notification record first to ensure it "reflects" in the UI
    const notification = this.notificationRepository.create({
      userId: eventData.userId,
      transactionId: eventData.transactionId,
      message: this.buildMessage(eventData),
      status: NotificationStatus.PENDING
    });

    const savedNotification = await this.notificationRepository.save(notification);
    logger.info('Notification record initialized', { notificationId: savedNotification.id });

    // 2. Fetch preferences and apply rules
    const preference = await this.preferenceService.getUserPreference(eventData.userId);
    
    // Default to enabled if no preference record exists
    const isEmailEnabled = preference?.emailEnabled !== false;
    const threshold = (preference && preference.notificationThreshold) ? Number(preference.notificationThreshold) : 0;
    const recipientEmail = preference?.email || 'user@example.com';

    // 3. Check Notification Rules (Threshold)
    if (threshold > 0 && eventData.totalValue < threshold) {
      logger.info('Transaction below threshold, skipping email', { 
        userId: eventData.userId, 
        threshold, 
        totalValue: eventData.totalValue 
      });
      savedNotification.status = NotificationStatus.SKIPPED;
      savedNotification.errorMessage = `Below threshold ($${threshold})`;
      await this.notificationRepository.save(savedNotification);
      return;
    }

    // 4. Check User Preferences (Email Enabled)
    if (!isEmailEnabled) {
      logger.info('Notifications disabled for user, skipping email', { userId: eventData.userId });
      savedNotification.status = NotificationStatus.SKIPPED;
      savedNotification.errorMessage = 'Notifications disabled in preferences';
      await this.notificationRepository.save(savedNotification);
      return;
    }

    // 5. Proceed to send
    await this.sendNotification(savedNotification, recipientEmail);
  }

  private async sendNotification(notification: Notification, email: string): Promise<void> {
    try {
      logger.info('Sending notification email', { 
        notificationId: notification.id, 
        email 
      });

      await retryWithBackoff(async () => {
        await this.emailService.sendEmail(email, 'Portfolio Transaction Alert', notification.message);
      }, this.MAX_RETRY_COUNT);

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);
      logger.info('Notification sent successfully', { notificationId: notification.id });
    } catch (error) {
      logger.error('Failed to send notification after retries', { 
        notificationId: notification.id, 
        error: (error as Error).message 
      });
      notification.status = NotificationStatus.FAILED;
      notification.retryCount += 1;
      notification.errorMessage = (error as Error).message;
      await this.notificationRepository.save(notification);
    }
  }

  private buildMessage(data: TransactionEventData): string {
    return `Type: ${data.type}, Asset: ${data.assetSymbol}, Quantity: ${data.quantity}, Price: $${data.price}, Total: $${data.totalValue}`;
  }
}
