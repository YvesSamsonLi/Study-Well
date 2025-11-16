import { z } from "zod";

export const WeekType = z.enum([
  "TEACHING_WEEK",
  "STUDY_WEEK",
  "RECESS_WEEK",
  "EXAM_WEEK",
  "PUBLIC_HOLIDAY",
]);

export const CalendarWeek = z.object({
  label: z.string(),                // e.g., "Teaching Week 1"
  kind: WeekType,                   // normalized → Prisma AcademicType
  weekNo: z.number().nullable(),    // null for non-numbered blocks
  startDate: z.string(),            // "YYYY-MM-DD"
  endDate: z.string(),              // "YYYY-MM-DD"
});

export const Holiday = z.object({
  date: z.string(),                 // "YYYY-MM-DD"
  name: z.string(),
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
