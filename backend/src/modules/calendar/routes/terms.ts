// src/modules/calendar/routes/terms.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../core/db/prisma";

export default async function registerTermsRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.get(
    "/terms",
    {
      // preHandler: [(app as any).authenticate], // uncomment if you want auth
      schema: { tags: ["calendar"], summary: "List terms" },
    },
    async (_req, reply) => {
      const terms = await prisma.term.findMany({ orderBy: { startsOn: "desc" } });
      reply.send(terms);
    }
  );
}