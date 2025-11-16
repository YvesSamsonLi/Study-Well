// auth/routes/logout.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../svc/auth.guard";
import { z } from "zod";

const OkSchema = z.object({ message: z.string() }).strict();

export default async function registerLogoutRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.post(
    "/logout",
    {
      preHandler: [requireAuth],
      schema: {
        tags: ["auth"],
        summary: "Logout (stateless)",
        response: { 200: OkSchema },
      },
    },
    async (_req, reply) => {
      return reply.send({ message: "Logged out" });
    }
  );
}
