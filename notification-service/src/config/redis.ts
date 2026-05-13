import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

export class RedisConnection {
  private client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({
      url,
      token
    });

    logger.info('Redis client initialized');
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.set(key, value, { ex: expirySeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
