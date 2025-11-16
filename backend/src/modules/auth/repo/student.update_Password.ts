import { prisma } from "../../../core/db/prisma";

export async function updateStudentPassword(studentId: string, passwordHash: string) {
  return prisma.student.update({ where: { id: studentId }, data: { passwordHash } });
}
