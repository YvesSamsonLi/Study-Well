import { FastifyInstance } from "fastify";
import { requireAccessAuth } from "../../../core/http/guard";
import { getPrefs } from "../repo/prefs.get";
import { defaultPrefs } from "../schema/preferences";

/**
 * GET /preferences
 * Returns saved preferences or server default if none exist.
 */
export async function getPrefsRoute(app: FastifyInstance) {
  app.get("/preferences", { preHandler: [requireAccessAuth] }, async (req, reply) => {
    const { sub } = (req.user ?? {}) as { sub: string };
    const prefs = await getPrefs(sub);
    reply.send(prefs ?? defaultPrefs);
  });
}
