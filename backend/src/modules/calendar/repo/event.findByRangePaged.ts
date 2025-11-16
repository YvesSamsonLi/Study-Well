import { prisma } from "../../../core/db/prisma";

export async function findByRangePaged(
  studentId: string, fromISO: string, toISO: string, page: number, limit: number, category?: string
) {
  const where: any = {
    studentId,
    startsAt: { lt: new Date(toISO) },
    endsAt:   { gt: new Date(fromISO) },
    ...(category ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.event.findMany({ where, orderBy: { startsAt: "asc" }, take: limit, skip: (page - 1) * limit }),
    prisma.event.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
