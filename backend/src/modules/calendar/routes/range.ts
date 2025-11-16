//src/modules/calendar/routes/range.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../core/db/prisma";

const RangeQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  termId: z.string().optional(),
  category: z.string().optional(), // e.g., "EXAMS" or custom user categories
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export default async function registerRangeRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.get(
    "/range",
    {
      preHandler: [(app as any).authenticate],
      schema: {
        tags: ["calendar"],
        summary: "List my events within a date range (paginated)",
        querystring: RangeQuerySchema,
      },
    },
    async (req: any, reply) => {
      const studentId: string = req.user.sub;
      const { from, to, termId, category, page, limit } = RangeQuerySchema.parse(req.query);

      const where = {
        studentId,
        startsAt: { gte: new Date(from) },
        endsAt: { lte: new Date(to) },
        ...(termId ? { termId } : {}),
        ...(category ? { category } : {}),
      };

      const [items, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: [{ startsAt: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.event.count({ where }),
      ]);

      return reply.send({ page, limit, total, items });
    }
  );
}