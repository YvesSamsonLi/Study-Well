// src/modules/calendar/routes/create_Calendar.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../core/db/prisma";

const CreateEventSchema = z.object({
  title: z.string().min(1),
  startsAt: z.string().datetime(), // ISO-8601
  endsAt: z.string().datetime(),
  location: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
}).strict();

export default async function registerCreateEvent(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.post(
    "/events",
    {
      preHandler: [(app as any).authenticate],
      schema: {
        tags: ["calendar"],
        summary: "Create a new user event",
        body: CreateEventSchema,
      },
    },
    async (req: any, reply) => {
      // 1) Validate payload
      const body = CreateEventSchema.parse(req.body);

      // 2) Auth user id from JWT
      const studentId: string = req.user.sub;

      // 3) Basic temporal sanity check
      const startsAt = new Date(body.startsAt);
      const endsAt = new Date(body.endsAt);
      if (!(endsAt > startsAt)) {
        return reply.code(400).send({ error: "endsAt must be after startsAt" });
      }

      // 4) Create Event and mirror to MainCalendar in a single TX
      const result = await prisma.$transaction(async (tx) => {
        // Create the Event row
        const created = await tx.event.create({
          data: {
            studentId,
            title: body.title,
            startsAt,
            endsAt,
            location: body.location,
            category: body.category,
            notes: body.notes,
            source: "USER",
            isLocked: false,
          },
        });

        // Find a semester that spans the event 
        const sem = await tx.semester.findFirst({
          where: {
            startsOn: { lte: startsAt },
            endsOn: {  gte: endsAt   },
          },
          select: { id: true },
        });

        // Compose idempotent where (use Event.id as externalId anchor)
        const where = {
          studentId_source_externalId_startsAt: {
            studentId,
            source: "USER",
            externalId: created.id,
            startsAt,
          },
        };

        // Upsert data (omit semesterId when not found; do NOT set null)
        const updateData: Record<string, any> = {
          title: created.title,
          endsAt,
          location: created.location ?? undefined,
          description: created.notes ?? undefined,
          isSynced: false,
        };
        if (sem) updateData.semesterId = sem.id;

        const createData: Record<string, any> = {
          studentId,
          title: created.title,
          startsAt,
          endsAt,
          location: created.location ?? undefined,
          description: created.notes ?? undefined,
          source: "USER",
          externalId: created.id,
          isSynced: false,
        };
        if (sem) createData.semesterId = sem.id;

        await tx.mainCalendar.upsert({
          where,
          update: updateData,
          create: createData,
        });

        return created;
      });

      return reply.code(201).send(result);
    }
  );
}