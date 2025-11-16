import { z } from "zod";

export const WeekType = z.enum([
  "TEACHING_WEEK",
  "STUDY_WEEK",
  "RECESS_WEEK",
  "EXAM_WEEK",
  "PUBLIC_HOLIDAY",
]);

export const CalendarWeek = z.object({
  label: z.string(),           // e.g., "Teaching Week 1"
  kind: WeekType,              // normalized to your Prisma enum names
  weekNo: z.number().nullable(), // null for holidays
  startDate: z.string(),       // ISO date (local)
  endDate: z.string(),         // ISO date (local)
});

export const Holiday = z.object({
  date: z.string(),            // ISO
  name: z.string(),            // e.g., "National Day"
});

export const AcademicCalendarJSON = z.object({
  termId: z.string(),
  academicYear: z.string().optional(),
  termName: z.string().optional(),
  weeks: z.array(CalendarWeek),
  holidays: z.array(Holiday),
});

export type AcademicCalendarJSON = z.infer<typeof AcademicCalendarJSON>;
export type WeekType = z.infer<typeof WeekType>;
