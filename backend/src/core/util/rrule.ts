/**
 * Minimal RRULE string builder (RFC5545).
 */

export type Recurrence = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval?: number;
  byweekday?: number[]; // [MO=1 .. SU=7] 
  count?: number;
  until?: string; // UTC YYYYMMDDTHHMMSSZ
};

export function toRRule(r: Recurrence): string {
  const parts = [`FREQ=${r.freq}`];
  if (r.interval) parts.push(`INTERVAL=${r.interval}`);
  if (r.byweekday?.length) parts.push(`BYDAY=${r.byweekday.join(",")}`);
  if (r.count) parts.push(`COUNT=${r.count}`);
  if (r.until) parts.push(`UNTIL=${r.until}`);
  return "RRULE:" + parts.join(";");
}
