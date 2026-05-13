import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP is not configured. Skipping email send.', { to, subject });
      return;
    }

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text
    });
  }
}
