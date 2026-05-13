import { Repository } from 'typeorm';
import { UserPreference } from '../models/user-preference.entity';
import { RedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

export class PreferenceService {
  private readonly CACHE_TTL = 3600;

  constructor(
    private preferenceRepository: Repository<UserPreference>,
    private redis?: RedisConnection
  ) {}

  async getUserPreference(userId: string): Promise<UserPreference | null> {
    const cacheKey = `user:preference:${userId}`;
    const cached = this.redis ? await this.redis.get(cacheKey) : null;

    if (cached) {
      logger.info('Preference cache hit', { userId });
      return JSON.parse(cached);
    }

    const preference = await this.preferenceRepository.findOne({
      where: { userId }
    });

    if (preference) {
      if (this.redis) {
        await this.redis.set(cacheKey, JSON.stringify(preference), this.CACHE_TTL);
      }
    }

    return preference;
  }

  async updatePreference(userId: string, updates: Partial<UserPreference>): Promise<UserPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId }
    });

    if (!preference) {
      preference = this.preferenceRepository.create({ userId, ...updates });
    } else {
      Object.assign(preference, updates);
    }

    const saved = await this.preferenceRepository.save(preference);
    if (this.redis) {
      await this.redis.del(`user:preference:${userId}`);
    }
    return saved;
  }
}
