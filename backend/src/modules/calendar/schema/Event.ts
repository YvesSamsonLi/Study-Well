import { z } from "zod";
export const ISODateTime = z.string().datetime({ offset: true }).or(z.string().datetime());

export const EventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  startsAt: ISODateTime,
  endsAt: ISODateTime,
  location: z.string().max(300).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  recurrence: z.string().regex(/^RRULE:/).max(1000).optional(),
});
export const EventUpdateSchema = EventCreateSchema.partial();

export const RangeQuerySchema = z.object({
  from: ISODateTime,
  to: ISODateTime,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.string().optional(),
});

export type EventCreateDTO = z.infer<typeof EventCreateSchema>;
export type EventUpdateDTO = z.infer<typeof EventUpdateSchema>;
export type RangeQuery = z.infer<typeof RangeQuerySchema>;
