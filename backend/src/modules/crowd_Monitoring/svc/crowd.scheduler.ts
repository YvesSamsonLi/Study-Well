import { Queue, Worker, JobsOptions } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import { CrowdMonitoringService } from './crowd.service';
import { SubscriptionsRepo } from '../repo/subscriptions.repo';
import type { LocationCrowdData, LibraryCrowd, CrowdLevelKey, LibraryId } from '../types';

type NotifyPayloadCarpark = {
  kind: 'carpark';
  locationId: string;               // carpark_number
  level: CrowdLevelKey;
  snapshot: LocationCrowdData;
};

type NotifyPayloadLibrary = {
  kind: 'library';
  libraryId: LibraryId;
  level: CrowdLevelKey;
  snapshot: LibraryCrowd;
};

type NotifyPayload = NotifyPayloadCarpark | NotifyPayloadLibrary;

const REFRESH_MS = Number(process.env.CROWD_REFRESH_MS ?? 60_000);     // 60s
const CACHE_TTL_SEC = Number(process.env.CROWD_CACHE_TTL_SEC ?? 90);  // 90s

export class CrowdScheduler {
  private refreshQ: Queue;
  private notifyQ: Queue;
  private svc = new CrowdMonitoringService();
  private subs: SubscriptionsRepo;

  constructor(private redis: Redis, private app: FastifyInstance) {
    const connection = (app as any).redis ?? redis;
    this.refreshQ = new Queue('crowd:refresh', { connection });
    this.notifyQ  = new Queue('crowd:notify',  { connection });
    this.subs = new SubscriptionsRepo(connection);
  }

  async ensureRepeat(): Promise<void> {
    const repeat: JobsOptions = { repeat: { every: REFRESH_MS } };
    await this.refreshQ.add('tick', {}, repeat);

    // -------- REFRESH WORKER --------
    new Worker('crowd:refresh', async () => {
      // 1) Pull latest carpark snapshot and cache
      const carparkSnapshot = await this.svc.getCurrentCrowdLevels();
      await this.redis.set('crowd:latest', JSON.stringify(carparkSnapshot), 'EX', CACHE_TTL_SEC);

      // 2) Compute library snapshot and cache
      const librarySnapshot = await this.svc.getLibrariesCrowd();
      await this.redis.set('crowd:libraries:latest', JSON.stringify(librarySnapshot), 'EX', CACHE_TTL_SEC);

      // 3) Notify carpark subscribers
      for (const loc of carparkSnapshot.locations) {
        const subs = await this.subs.listByLocation(loc.locationId);
        if (!subs.length) continue;

        for (const s of subs) {
          const meets =
            s.targetLevel === 'low' ||
            (s.targetLevel === 'medium' && (loc.crowdLevel === 'medium' || loc.crowdLevel === 'high')) ||
            (s.targetLevel === 'high' && loc.crowdLevel === 'high');

          if (meets) {
            const payload: NotifyPayloadCarpark = {
              kind: 'carpark',
              locationId: loc.locationId,
              level: loc.crowdLevel,
              snapshot: loc,
            };
            await this.notifyQ.add('notify', payload);
          }
        }
      }

      // 4) Notify library subscribers 
      for (const lib of librarySnapshot.libraries) {
        const subs = await this.subs.listByLibrary?.(lib.libraryId) ?? [];
        if (!subs.length) continue;

        for (const s of subs) {
          const meets =
            s.targetLevel === 'low' ||
            (s.targetLevel === 'medium' && (lib.crowdLevel === 'medium' || lib.crowdLevel === 'high')) ||
            (s.targetLevel === 'high' && lib.crowdLevel === 'high');

          if (meets) {
            const payload: NotifyPayloadLibrary = {
              kind: 'library',
              libraryId: lib.libraryId,
              level: lib.crowdLevel,
              snapshot: lib,
            };
            await this.notifyQ.add('notify', payload);
          }
        }
      }
    }, { connection: (this.app as any).redis ?? this.redis });

    // -------- NOTIFY WORKER --------
    new Worker('crowd:notify', async (job) => {
      const payload = job.data as NotifyPayload;

      // TODO: wire this into your nudges pipeline (e.g., enqueue a user notification job)
      // For now, we just log a structured message:
      if (payload.kind === 'carpark') {
        (this.app.log ?? console).info({
          type: 'carpark',
          locationId: payload.locationId,
          level: payload.level,
          occupancy: `${payload.snapshot.currentOccupancy}/${payload.snapshot.maxCapacity}`,
          lastUpdated: payload.snapshot.lastUpdated,
        }, 'Crowd threshold reached (carpark)');
      } else {
        (this.app.log ?? console).info({
          type: 'library',
          libraryId: payload.libraryId,
          level: payload.level,
          occupancyPct: Math.round(payload.snapshot.occupancyPct),
          lastUpdated: payload.snapshot.lastUpdated,
        }, 'Crowd threshold reached (library)');
      }
    }, { connection: (this.app as any).redis ?? this.redis });
  }
}
