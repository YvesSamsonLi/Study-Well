// src/modules/calendar/routes/update_Calendar.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../core/db/prisma";

const UpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

export default async function registerUpdateEvent(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.patch(
    "/events/:id",
    {
      preHandler: [(app as any).authenticate],
      schema: {
        tags: ["calendar"],
        summary: "Update a user event",
        params: z.object({ id: z.string().min(1) }),
        body: UpdateEventSchema,
      },
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const body = UpdateEventSchema.parse(req.body);
      const studentId: string = req.user.sub;

      const existing = await prisma.event.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: "Event not found" });
      if (existing.studentId !== studentId) return reply.code(403).send({ error: "Forbidden" });
      if (existing.isLocked) return reply.code(400).send({ error: "Locked events cannot be edited" });

      // Temporal sanity if both are provided
      if (body.startsAt && body.endsAt) {
        const s = new Date(body.startsAt);
        const e = new Date(body.endsAt);
        if (!(e > s)) return reply.code(400).send({ error: "endsAt must be after startsAt" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // 1) Update base Event
        const e = await tx.event.update({
          where: { id },
          data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.startsAt !== undefined && { startsAt: new Date(body.startsAt) }),
            ...(body.endsAt !== undefined && { endsAt: new Date(body.endsAt) }),
            ...(body.location !== undefined && { location: body.location ?? null }),
            ...(body.category !== undefined && { category: body.category ?? null }),
            ...(body.notes !== undefined && { notes: body.notes ?? null }),
          },
        });

        // 2) If startsAt changed, remove the old MainCalendar row (anchored by old startsAt)
        const startsAtChanged = body.startsAt
          ? new Date(body.startsAt).getTime() !== existing.startsAt.getTime()
          : false;

        if (startsAtChanged) {
          await tx.mainCalendar.deleteMany({
            where: {
              studentId,
              source: "USER",
              externalId: id,
              startsAt: existing.startsAt,
            },
          });
        }

        // 3) Recompute semester for the new/updated time range
        const sem = await tx.semester.findFirst({
          where: {
            startsOn: { lte: e.startsAt },
            endsOn: { gte: e.endsAt },
          },
          select: { id: true },
        });

        // 4) Upsert the mirrored MainCalendar row (omit semesterId if none)
        const where = {
          studentId_source_externalId_startsAt: {
            studentId,
            source: "USER",
            externalId: id,
            startsAt: e.startsAt,
          },
        };

        const updateData: Record<string, any> = {
          title: e.title,
          endsAt: e.endsAt,
          location: e.location ?? undefined,
          description: e.notes ?? undefined,
          isSynced: false,
        };
        if (sem) updateData.semesterId = sem.id;

        const createData: Record<string, any> = {
          studentId,
          title: e.title,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          location: e.location ?? undefined,
          description: e.notes ?? undefined,
          source: "USER",
          externalId: e.id,
          isSynced: false,
        };
        if (sem) createData.semesterId = sem.id;

        await tx.mainCalendar.upsert({
          where,
          update: updateData,
          create: createData,
        });

        return e;
      });

      return reply.send(updated);
    }
  );
}