// src/modules/calendar/routes/list_Calendar.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../../core/db/prisma";

export default async function registerListEvents(app: FastifyInstance) {
  app.get(
    "/events",
    { preHandler: [(app as any).authenticate], schema: { tags: ["calendar"], summary: "List my user events" } },
    async (req: any, reply) => {
      const studentId: string = req.user.sub;
      const events = await prisma.event.findMany({
        where: { studentId, source: "USER" },
        orderBy: { startsAt: "asc" },
      });
      return reply.send(events);
    }
  );
}
