/**
 * Logical validation beyond Zod's shape checks.
 * - start < end
 * - max duration (guard rails)
 */
export function ensureValidWindow(startsAt: Date, endsAt: Date, maxHours = 24) {
  if (!(startsAt instanceof Date) || isNaN(+startsAt)) throw new Error("Invalid startsAt");
  if (!(endsAt instanceof Date) || isNaN(+endsAt)) throw new Error("Invalid endsAt");
  if (endsAt <= startsAt) throw new Error("endsAt must be after startsAt");
  const diffHrs = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60);
  if (diffHrs > maxHours) throw new Error(`event cannot exceed ${maxHours} hours`);
}
