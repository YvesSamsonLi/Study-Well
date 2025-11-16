import { FastifyInstance } from 'fastify';
import { requireAccessAuth } from '../../../core/http/guard';
import { NotFound, sendProblem } from '../../../core/http/errors';
import { getEventByIdOwned } from '../repo/event.getByIdOwned';
import { strongETagFromDate } from '../../../core/http/etag';

export default async function (app: FastifyInstance) {
  app.get('/calendar/:id', { preHandler: requireAccessAuth }, async (req, reply) => {
    const { sub } = (req.user ?? {}) as { sub: string };
    const { id } = req.params as { id: string };

    const event = await getEventByIdOwned(sub, id);
    if (!event) {
      return sendProblem(reply, NotFound('Event not found'));
    }

    // Send ETag for client to use in If-Match headers
    const etag = strongETagFromDate(event.updatedAt);
    
    reply
      .code(200)
      .header('ETag', etag)
      .send({ event });
  });
}