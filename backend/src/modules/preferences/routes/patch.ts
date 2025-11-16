import { FastifyInstance } from "fastify";
import { requireAccessAuth } from "../../../core/http/guard";
import { PreferencesSchema } from "../schema/preferences";
import { getPrefs } from "../repo/prefs.get";
import { upsertPrefs } from "../repo/prefs.update";
import { BadRequest, sendProblem } from "../../../core/http/errors";
import { z, type ZodIssue } from "zod";

/**
 * Manual deep-partial schema for preferences (works on any Zod version).
 * Only provided fields are validated and applied.
 */
const PartialPrefs = z.object({
  outdoorAllowed: z.boolean().optional(),
  nudgeWindow: z
    .object({
      start: z.number().int().min(0).max(23).optional(),
      end: z.number().int().min(0).max(23).optional(),
    })
    .optional(),
  quietHours: z
    .object({
      start: z.number().int().min(0).max(23).optional(),
      end: z.number().int().min(0).max(23).optional(),
    })
    .optional(),
  timezone: z.string().optional(),
});

export async function patchPrefsRoute(app: FastifyInstance) {
  app.patch(
    "/preferences",
    { preHandler: [requireAccessAuth], schema: { body: PartialPrefs } as any },
    async (req, reply) => {
      const { sub } = (req.user ?? {}) as { sub: string };

      // Validate body
      const parsed = PartialPrefs.safeParse(req.body);
      if (!parsed.success) {
        const detail = parsed.error.issues
          .map((i: ZodIssue) => `${(i.path || []).join(".") || "(root)"}: ${i.message}`)
          .join("; ");
        return sendProblem(reply, BadRequest(detail));
      }

      // Load current (or defaults)
      const current =
        (await getPrefs(sub)) ??
        {
          outdoorAllowed: true,
          nudgeWindow: { start: 9, end: 21 },
          quietHours: { start: 23, end: 7 },
        };

      const incoming = parsed.data;

      // Merge shallow + nested safely (only override provided sub-fields)
      const merged = {
        ...current,
        ...(incoming.outdoorAllowed !== undefined && { outdoorAllowed: incoming.outdoorAllowed }),
        ...(incoming.timezone !== undefined && { timezone: incoming.timezone }),
        nudgeWindow: {
          ...current.nudgeWindow,
          ...(incoming.nudgeWindow ?? {}),
        },
        quietHours: {
          ...current.quietHours,
          ...(incoming.quietHours ?? {}),
        },
      };

      const saved = await upsertPrefs(sub, merged);
      reply.send(saved);
    }
  );
}
