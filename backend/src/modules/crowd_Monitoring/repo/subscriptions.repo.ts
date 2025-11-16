import type { Subscription } from '../types';
import type { Redis } from 'ioredis';
import type { LibraryId, CrowdLevelKey } from '../types';

/**
 * Redis-based repository for crowd subscriptions.
 * Stores both carpark- and library-level subscriptions.
 *
 * Keys:
 *   crowd:subs:<carpark_number>     → Set<Subscription>
 *   crowd:libsubs:<libraryId>       → Set<{userId,libraryId,targetLevel,createdAt}>
 */
export class SubscriptionsRepo {
  constructor(private redis: Redis) {}

  // ----------- Carpark-level subscriptions -----------
  async add(sub: Subscription): Promise<void> {
    const key = `crowd:subs:${sub.locationId}`;
    await this.redis.sadd(key, JSON.stringify(sub));
  }

  async listByLocation(locationId: string): Promise<Subscription[]> {
    const key = `crowd:subs:${locationId}`;
    const raw = await this.redis.smembers(key);
    return raw.map((s) => JSON.parse(s) as Subscription);
  }

  // ----------- Library-level subscriptions -----------
  async addLibrarySub(sub: {
    userId: string;
    libraryId: LibraryId;
    targetLevel: CrowdLevelKey;
    createdAt: string;
  }): Promise<void> {
    const key = `crowd:libsubs:${sub.libraryId}`;
    await this.redis.sadd(key, JSON.stringify(sub));
  }

  async listByLibrary(libraryId: LibraryId): Promise<
    Array<{ userId: string; libraryId: LibraryId; targetLevel: CrowdLevelKey; createdAt: string }>
  > {
    const key = `crowd:libsubs:${libraryId}`;
    const raw = await this.redis.smembers(key);
    return raw.map((s) => JSON.parse(s));
  }

  // Utility to clear all (for tests or resets)
  async clearAll(): Promise<void> {
    const keys = await this.redis.keys('crowd:subs:*');
    const libKeys = await this.redis.keys('crowd:libsubs:*');
    if (keys.length) await this.redis.del(...keys);
    if (libKeys.length) await this.redis.del(...libKeys);
  }
}
