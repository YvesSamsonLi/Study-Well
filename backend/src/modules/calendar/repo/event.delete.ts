import { prisma } from "../../../core/db/prisma";

/** Delete an event by id only if owned by `studentId`. Returns true if deleted. */
export async function deleteEvent(studentId: string, id: string): Promise<boolean> {
  const res = await prisma.event.deleteMany({ where: { id, studentId } });
  return res.count > 0;
}
