// shared/endpoints/calendar.ts
import type { RangeQuery } from "../contracts/calendar";

export const CalendarEndpoints = {
  base: "/v1/calendar",
  terms: "/v1/calendar/terms",
  events: "/v1/calendar/events",
  range: "/v1/calendar/range",
  eventById: (id: string) => `/v1/calendar/events/${encodeURIComponent(id)}`,
} as const;

export function buildRangeUrl(base: string, q: RangeQuery) {
  const root = base.endsWith("/") ? base : base + "/";
  const u = new URL(CalendarEndpoints.range, root);
  u.searchParams.set("from", q.from);
  u.searchParams.set("to", q.to);
  if ((q as any).semesterId) u.searchParams.set("semesterId", (q as any).semesterId);
  if (q.page) u.searchParams.set("page", String(q.page));
  if (q.limit) u.searchParams.set("limit", String(q.limit));
  if (q.category) u.searchParams.set("category", q.category);
  return u.toString();
}
