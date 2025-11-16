import { prisma } from "../../../core/db/prisma";
import type { PreferencesDTO } from "../schema/preferences";

/**
 * Upsert user preferences (full replace semantics).
 * Returns the normalized DTO after persistence.
 */
export async function upsertPrefs(studentId: string, dto: PreferencesDTO): Promise<PreferencesDTO> {
  const data = {
    studentId,
    outdoorAllowed: dto.outdoorAllowed,
    nudgeStartHour: dto.nudgeWindow.start,
    nudgeEndHour:   dto.nudgeWindow.end,
    quietStartHour: dto.quietHours.start,
    quietEndHour:   dto.quietHours.end,
    timezone:       dto.timezone ?? null,
  };

  const row = await prisma.preference.upsert({
    where: { studentId },
    update: data,
    create: data,
  });

  return {
    outdoorAllowed: row.outdoorAllowed,
    nudgeWindow: { start: row.nudgeStartHour, end: row.nudgeEndHour },
    quietHours:  { start: row.quietStartHour, end: row.quietEndHour },
    timezone: row.timezone ?? undefined,
  };
}
