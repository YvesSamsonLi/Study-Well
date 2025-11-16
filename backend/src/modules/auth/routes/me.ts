// auth/routes/me.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../core/db/prisma";
import { requireAuth } from "../svc/auth.guard";
import { z } from "zod";

const MeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
}).strict();

export default async function registerMeRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.get(
    "/me",
    {
      preHandler: [requireAuth],
      schema: {
        tags: ["auth"],
        summary: "Get current user profile",
        response: { 200: MeSchema, 404: z.object({}).passthrough() },
      },
    },
    async (req, reply) => {
      const userId = req.user!.sub;
      const user = await prisma.student.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
      if (!user) return reply.code(404).send({ message: "User not found" });
      return reply.send(user);
    }
  );
}
