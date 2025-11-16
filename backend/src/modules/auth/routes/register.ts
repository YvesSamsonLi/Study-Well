// auth/routes/register.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../core/db/prisma";
import { RegisterSchema, RegisterDTO } from "../schema/Register";
import { hashPwd } from "../svc/hash_Password";
import { z } from "zod";

// what we return on success
const CreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
}).strict();

export default async function registerRegisterRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.post<{ Body: RegisterDTO }>(
    "/register",
    {
      schema: {
        tags: ["auth"],
        summary: "Create an account",
        body: RegisterSchema,
        response: {
          201: CreatedSchema,
          409: z.object({ message: z.string() }).strict(),
        },
      },
    },
    async (req, reply) => {
      const { name, email, password } = req.body;

      // 1) prevent duplicates
      const existing = await prisma.student.findUnique({ where: { email } });
      if (existing) {
        return reply.code(409).send({ message: "Email already registered" });
      }

      // 2) validate strength + hash
      const passwordHash = await hashPwd(password);

      // 3) create user
      const student = await prisma.student.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true },
      });

      // 4) done 
      return reply.code(201).send(student);

    }
  );
}
