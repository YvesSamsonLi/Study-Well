// auth/routes/change_Password.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../core/db/prisma";
import { ChangePasswordSchema, ChangePasswordDTO } from "../schema/change_Password_Schema";
import { verifyPassword } from "../svc/verify_Password";
import { hashPwd } from "../svc/hash_Password";
import { requireAuth } from "../svc/auth.guard";
import { z } from "zod";

const OkSchema = z.object({ message: z.string() }).strict();

export default async function registerChangePasswordRoute(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>();

  f.patch<{ Body: ChangePasswordDTO }>(
    "/password",
    {
      preHandler: [requireAuth],
      schema: {
        tags: ["auth"],
        summary: "Change current user's password",
        body: ChangePasswordSchema,
        response: {
          200: OkSchema,
          400: z.object({}).passthrough(),
          401: z.object({}).passthrough(),
          404: z.object({}).passthrough(),
        },
      },
    },
    async (req, reply) => {
      const { oldPassword, newPassword } = req.body;

      const userId = req.user!.sub; // set by requireAuth
      const student = await prisma.student.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });

      if (!student) {
        return reply.code(404).send({ message: "User not found" });
      }

      const ok = await verifyPassword(oldPassword, student.passwordHash);
      if (!ok) {
        return reply.code(400).send({ message: "Old password is incorrect" });
      }

      const newHash = await hashPwd(newPassword);
      await prisma.student.update({
        where: { id: student.id },
        data: { passwordHash: newHash },
      });

      return reply.send({ message: "Password updated" });
    }
  );
}
