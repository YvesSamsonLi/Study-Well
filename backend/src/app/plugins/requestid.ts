import fp from "fastify-plugin";
import { randomUUID } from "crypto";

/**
 * Adds a stable request ID (x-request-id) to every request.
 * Also attaches a child logger with { reqId } for structured logs
*/
export default fp(async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    // Prefer incoming ID from reverse proxy if present, else generate one
    const id = req.headers["x-request-id"]?.toString() || randomUUID();

    // Make it available downstream and in the response
    req.headers["x-request-id"] = id;
    reply.header("x-request-id", id);

    // Enrich logger with request-scoped id
    req.log = app.log.child({ reqId: id });
  });
});
