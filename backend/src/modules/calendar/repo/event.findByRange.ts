import { prisma } from "../../../core/db/prisma";

/**
 * Any-overlap query: returns events intersecting [from, to].
 * Condition: startsAt < to && endsAt > from
 */
export async function findByRange(studentId: string, fromISO: string, toISO: string) {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  return prisma.event.findMany({
    where: {
      studentId,
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    orderBy: { startsAt: "asc" },
  });
}
