import { prisma } from "../../../core/db/prisma";

/** Lookup student by unique email. */
export async function findStudentByEmail(email: string) {
  return prisma.student.findUnique({ where: { email } });
}
