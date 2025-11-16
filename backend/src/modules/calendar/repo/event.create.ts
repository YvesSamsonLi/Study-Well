import { prisma } from "../../../core/db/prisma";
import type { EventCreateDTO } from "../schema/Event";

/** Persist a new event owned by `studentId`. Returns the row. */
export async function createEvent(studentId: string, dto: EventCreateDTO) {
  return prisma.event.create({
    data: { ...dto, studentId, startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt) },
  });
}
