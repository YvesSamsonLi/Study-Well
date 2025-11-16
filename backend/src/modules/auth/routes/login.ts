// auth/routes/login.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../core/db/prisma";
import { LoginSchema, LoginDTO } from "../schema/Login";
import { verifyPassword } from "../svc/verify_Password";
import { issueAccess } from "../svc/issue_JWT";
import { z } from "zod";

const RespSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(), // seconds
}).strict();

// If env.JWT_ACCESS_TTL is e.g. "30m", just expose a sensible constant for clients.
// Adjust to match your env (or parse it if you prefer).
const DEFAULT_EXPIRES_IN_SECONDS = 30 * 60;

export default async function registerLoginRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.post<{ Body: LoginDTO }>(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Login and obtain access token",
        body: LoginSchema,
        response: { 200: RespSchema, 401: z.object({ message: z.string() }).strict() },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body;

      // 1) fetch minimal fields
      const student = await prisma.student.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
      });

      // 2) prevent user enumeration: same 401 for not found / bad password / empty hash
      if (!student || !(await verifyPassword(password, student.passwordHash))) {
        return reply.code(401).send({ message: "Invalid email or password" });
      }

      // 3) mint access token (stateless JWT)
      const accessToken = issueAccess(app, student.id, { email: student.email });

      // 4) return token + TTL (seconds)
      return reply.send({ accessToken, expiresIn: DEFAULT_EXPIRES_IN_SECONDS });
    }
  );
}
