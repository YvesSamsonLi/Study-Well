import { prisma } from "../../../core/db/prisma";
import type { PreferencesDTO } from "../schema/preferences";

/**
 * Fetch user preferences as a DTO, or `null` if none persisted yet.
 * Prisma model assumed:
 *   model Preference {
 *     studentId       String  @id
 *     outdoorAllowed  Boolean @default(true)
 *     nudgeStartHour  Int     @default(9)
 *     nudgeEndHour    Int     @default(21)
 *     quietStartHour  Int     @default(23)
 *     quietEndHour    Int     @default(7)
 *     timezone        String?
 *     student         Student @relation(fields: [studentId], references: [id])
 *   }
 */
export async function getPrefs(studentId: string): Promise<PreferencesDTO | null> {
  const row = await prisma.preference.findUnique({ where: { studentId } });
  if (!row) return null;

  return {
    outdoorAllowed: row.outdoorAllowed,
    nudgeWindow: { start: row.nudgeStartHour, end: row.nudgeEndHour },
    quietHours:  { start: row.quietStartHour, end: row.quietEndHour },
    timezone: row.timezone ?? undefined,
  };
}
