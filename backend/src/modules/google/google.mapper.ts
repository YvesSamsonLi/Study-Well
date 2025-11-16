import type { MainCalendar } from "@prisma/client";

export function toGoogleInsert(e: MainCalendar) {
  return {
    summary: e.title,
    location: e.location ?? undefined,
    description: e.description ?? undefined,
    start: { dateTime: e.startsAt.toISOString() },
    end:   { dateTime: e.endsAt.toISOString() },
  };
}
export function toGoogleUpdate(e: MainCalendar) {
  // same shape; Google treats missing fields as unchanged if you use patch()
  return toGoogleInsert(e);
}
