// shared/contracts/calendar.ts
import { z } from "zod";

/** ---------- Common primitives ---------- */
export const ISODateTime = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime()); // allow without offset too

/** Enum mirrors Prisma's EventSource */
export const EventSource = z.enum(["USER", "ACADEMIC", "TIMETABLE"]);

/** ---------- Event DTO (mirror prisma) ---------- */
export const EventId = z.string().min(1);

export const EventDTO = z.object({
  id: EventId,
  studentId: z.string(),
  title: z.string(),
  startsAt: ISODateTime,
  endsAt: ISODateTime,
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  semesterId: z.string().nullable().optional(),   // <-- align with Prisma
  source: EventSource.optional(),                  // <-- align with Prisma
  isLocked: z.boolean().optional(),
  recurrence: z.string().nullable().optional(),   // exists in Prisma Event
  createdAt: ISODateTime.optional(),
  updatedAt: ISODateTime.optional(),
});
export type EventDTO = z.infer<typeof EventDTO>;

/** ---------- Create & Update payloads ---------- */
export const CreateEventRequest = z.object({
  title: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
}).strict();
export type CreateEventRequest = z.infer<typeof CreateEventRequest>;

export const CreateEventResponse = EventDTO;
export type CreateEventResponse = z.infer<typeof CreateEventResponse>;

export const UpdateEventRequest = z.object({
  title: z.string().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();
export type UpdateEventRequest = z.infer<typeof UpdateEventRequest>;

export const UpdateEventResponse = EventDTO;
export type UpdateEventResponse = z.infer<typeof UpdateEventResponse>;

/** ---------- List & Range ---------- */
export const ListEventsResponse = z.array(EventDTO);
export type ListEventsResponse = z.infer<typeof ListEventsResponse>;

/**
 * Accept both `semesterId` (preferred) and legacy `termId` for compatibility.
 * If both provided, we reject to avoid ambiguity.
 */
export const RangeQuery = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  semesterId: z.string().optional(),
  termId: z.string().optional(), // legacy alias
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})
.refine(q => !(q.semesterId && q.termId), {
  message: "Use either semesterId or termId, not both",
})
.transform(q => ({
  ...q,
  // normalize: prefer semesterId; fallback to termId
  semesterId: q.semesterId ?? q.termId ?? undefined,
}));
export type RangeQuery = z.infer<typeof RangeQuery>;

export const RangeResponse = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  items: z.array(EventDTO),
});
export type RangeResponse = z.infer<typeof RangeResponse>;

/** ---------- Terms/Semesters ---------- */
// If your backend returns Semester rows, this DTO matches those fields.
export const TermDTO = z.object({
  id: z.string(),
  key: z.string().optional(), // if you store AY short code
  name: z.string(),
  startsOn: ISODateTime,
  endsOn: ISODateTime,
  createdAt: ISODateTime.optional(),
  updatedAt: ISODateTime.optional(),
});
export type TermDTO = z.infer<typeof TermDTO>;

export const TermsResponse = z.array(TermDTO);
export type TermsResponse = z.infer<typeof TermsResponse>;

/** ---------- Delete ---------- */
export const DeleteEventResponse = z.object({ ok: z.boolean() });
export type DeleteEventResponse = z.infer<typeof DeleteEventResponse>;
