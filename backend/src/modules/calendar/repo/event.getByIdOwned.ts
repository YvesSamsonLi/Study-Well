import { prisma } from "../../../core/db/prisma";

/** Fetch an event only if it belongs to `studentId`. */
export async function getEventByIdOwned(studentId: string, id: string) {
  return prisma.event.findFirst({ where: { id, studentId } });
}
