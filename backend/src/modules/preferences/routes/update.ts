import { FastifyInstance } from "fastify";
import { requireAccessAuth } from "../../../core/http/guard";
import { PreferencesSchema, type PreferencesDTO } from "../schema/preferences";
import { upsertPrefs } from "../repo/prefs.update";
import { BadRequest, sendProblem } from "../../../core/http/errors";
import type { ZodIssue } from "zod";

/**
 * PUT /preferences
 * Full replace. Validates body with Zod; upserts row.
 */
export async function updatePrefsRoute(app: FastifyInstance) {
  app.put(
    "/preferences",
    { preHandler: [requireAccessAuth], schema: { body: PreferencesSchema } as any },
    async (req, reply) => {
      // Validate in case fastify-zod adapter isn't in use:
      const parsed = PreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((i: ZodIssue) => `${(i.path || []).join(".") || "(root)"}: ${i.message}`)
          .join("; ");
        return sendProblem(reply, BadRequest(detail));
      }

      const { sub } = (req.user ?? {}) as { sub: string };
      const dto = parsed.data as PreferencesDTO;

      const saved = await upsertPrefs(sub, dto);
      reply.send(saved);
    }
  );
}