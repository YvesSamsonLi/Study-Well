// src/modules/calendar/routes/delete_Calendar.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../core/db/prisma";

export default async function registerDeleteEvent(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.delete(
    "/events/:id",
    {
      preHandler: [(app as any).authenticate],
      schema: {
        tags: ["calendar"],
        summary: "Delete a user event",
        params: z.object({ id: z.string().min(1) }),
      },
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const studentId: string = req.user.sub;

      const existing = await prisma.event.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: "Event not found" });
      if (existing.studentId !== studentId) return reply.code(403).send({ error: "Forbidden" });
      if (existing.isLocked) return reply.code(400).send({ error: "Locked events cannot be deleted" });

      await prisma.$transaction(async (tx) => {
        await tx.event.delete({ where: { id } });
        await tx.mainCalendar.deleteMany({
          where: { studentId, source: "USER", externalId: id },
        });
      });

      return reply.code(204).send();
    }
  );
}