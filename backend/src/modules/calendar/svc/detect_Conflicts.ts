import { isBefore, max as maxDate, min as minDate } from "date-fns";

export type Conflict = { aId: string; bId: string; overlapMs: number };

/** Conflict detection after sort — fine for per-user daily windows. */
export function detectConflicts(events: { id: string; startsAt: Date; endsAt: Date }[]): Conflict[] {
  const res: Conflict[] = [];
  const sorted = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      // quick exit: once the next event starts after or at the current end, no more overlaps for i
      if (!isBefore(sorted[j].startsAt, sorted[i].endsAt)) break;

      // v3: max/min expect an array
      const overlapStart = maxDate([sorted[i].startsAt, sorted[j].startsAt]);
      const overlapEnd   = minDate([sorted[i].endsAt,   sorted[j].endsAt]);

      const ms = Math.max(0, overlapEnd.getTime() - overlapStart.getTime());
      if (ms > 0) {
        res.push({ aId: sorted[i].id, bId: sorted[j].id, overlapMs: ms });
      }
    }
  }
  return res;
}
