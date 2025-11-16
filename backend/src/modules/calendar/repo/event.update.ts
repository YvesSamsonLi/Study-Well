import { prisma } from "../../../core/db/prisma";
import type { EventUpdateDTO } from "../schema/Event";

/**
 * Update an event only if owned by `studentId`.
 * Returns the updated row or null if not found/owned.
 */
export async function updateEvent(studentId: string, id: string, patch: EventUpdateDTO) {
  // Normalize datetime fields if present
  const data: any = { ...patch };
  if (patch.startsAt) data.startsAt = new Date(patch.startsAt);
  if (patch.endsAt) data.endsAt = new Date(patch.endsAt);

  // Use updateMany to enforce ownership in the WHERE clause.
  const res = await prisma.event.updateMany({
    where: { id, studentId },
    data,
  });

  if (res.count === 0) return null;
  return prisma.event.findUnique({ where: { id } });
}
