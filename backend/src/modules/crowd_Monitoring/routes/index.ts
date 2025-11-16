import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { sendProblem, NotFound } from '../../../core/http/errors';
import { CrowdMonitoringService } from '../svc/crowd.service';
import { CrowdScheduler } from '../svc/crowd.scheduler';
import { SubscribeBodySchema, LocationParamsSchema } from '../schema';
import { LIBRARIES, type LibraryId } from '../configs/library-map';

const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const svc = new CrowdMonitoringService();

  // Boot scheduler if Redis is present
  const redis = (app as any).redis;
  if (redis) {
    const scheduler = new CrowdScheduler(redis, app);
    scheduler.ensureRepeat().catch((e) => app.log.error(e, 'crowd scheduler'));
  } else {
    app.log.warn('Redis missing; crowd scheduler not started');
  }

  // ------------------------------
  // Carpark-level endpoints
  // ------------------------------

  // GET /v1/crowd
  app.get('/', async (_req, reply) => {
    try {
      const cached = (await (app as any).redis?.get('crowd:latest')) as string | undefined;
      if (cached) return reply.send(JSON.parse(cached));
      const data = await svc.getCurrentCrowdLevels();
      reply.send(data);
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch crowd levels');
      return sendProblem(reply, { status: 500, title: 'Failed to fetch crowd levels' });
    }
  });

  // GET /v1/crowd/:locationId  (locationId = carpark_number)
  app.get<{ Params: { locationId: string } }>('/:locationId', async (request, reply) => {
    const parsed = LocationParamsSchema.safeParse(request.params);
    if (!parsed.success) return sendProblem(reply, NotFound('Location not found'));
    try {
      const data = await svc.getLocationCrowdLevel(parsed.data.locationId);
      reply.send(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'Location not found') {
        return sendProblem(reply, NotFound('Location not found'));
      }
      app.log.error({ err }, 'Failed to fetch location crowd level');
      return sendProblem(reply, { status: 500, title: 'Failed to fetch location crowd level' });
    }
  });

  // POST /v1/crowd/subscribe
  app.post('/subscribe', async (request, reply) => {
    const body = SubscribeBodySchema.safeParse(request.body);
    if (!body.success) return sendProblem(reply, { status: 400, title: 'Invalid body' });

    const userId = (request as any).user?.id ?? 'demo-user';
    const repo = new (await import('../repo/subscriptions.repo')).SubscriptionsRepo((app as any).redis);
    await repo.add({
      userId,
      locationId: body.data.locationId,
      targetLevel: body.data.targetLevel,
      createdAt: new Date().toISOString(),
    });
    reply.code(204).send();
  });

  // ------------------------------
  // Library-level endpoints
  // ------------------------------

  // GET /v1/crowd/libraries  → ranked least→most crowded
  app.get('/libraries', async (_req, reply) => {
    try {
      const data = await svc.getLibrariesCrowd();
      reply.send(data);
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch library crowd');
      return sendProblem(reply, { status: 500, title: 'Failed to fetch library crowd' });
    }
  });

  // GET /v1/crowd/libraries/summary → human-readable message + payload
  app.get('/libraries/summary', async (_req, reply) => {
    try {
      const data = await svc.getLibrariesCrowd();
      const text = svc.buildLibrarySummaryMessage(data);
      reply.send({ text, ...data });
    } catch (err) {
      app.log.error({ err }, 'Failed to build summary');
      return sendProblem(reply, { status: 500, title: 'Failed to build summary' });
    }
  });

  // GET /v1/crowd/libraries/:libraryId → single library from map
  app.get<{ Params: { libraryId: string } }>('/libraries/:libraryId', async (request, reply) => {
    const libraryId = request.params.libraryId as LibraryId;
    if (!LIBRARIES[libraryId]) {
      return sendProblem(reply, NotFound('Library not found'));
    }

    try {
      const data = await svc.getLibrariesCrowd();
      const one = data.libraries.find(l => l.libraryId === libraryId);
      if (!one) return sendProblem(reply, NotFound('Library not found'));
      reply.send({ library: one, timestamp: data.timestamp });
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch library');
      return sendProblem(reply, { status: 500, title: 'Failed to fetch library' });
    }
  });
};

export default routes;
