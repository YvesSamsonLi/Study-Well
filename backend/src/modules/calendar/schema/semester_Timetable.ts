import { z } from "zod";

export const ZClassType = z.enum(["LEC", "TUT", "LAB", "SEM", "OTHER"]);
export const ZDelivery  = z.enum(["PHYSICAL", "ONLINE", "HYBRID"]);

export const ZWeekSpec = z.object({
  raw: z.string().min(1),                         // e.g. "Wk1-9,11-13" or "1-9,11-13"
  weeks: z.array(z.number().int().min(1)).optional(), // normalized after parse
});

export const ZClassSlot = z.object({
  courseCode: z.string().min(3),                  // "SC2006"
  courseName: z.string().optional(),
  component:  ZClassType,                         // LEC/TUT/SEM/LAB/OTHER
  groupIndex: z.string().min(1),                  // "SCL2", "1", "SCL4"
  location:   z.string().min(1),                  // "ONLINE", "LT19A", "LHN-TR-03"
  dayOfWeek:  z.number().int().min(1).max(7),     // 1=Mon..7=Sun
  startTime:  z.string().regex(/^(\d{4}|\d{2}:\d{2})$/), // "0830" or "08:30"
  endTime:    z.string().regex(/^(\d{4}|\d{2}:\d{2})$/),
  weekSpec:   ZWeekSpec,
  delivery:   ZDelivery.optional(),               // inferred from location
});

export const ZExam = z.object({
  courseCode: z.string().min(3),
  courseName: z.string().optional(),
  startsAt:   z.string().datetime(),
  endsAt:     z.string().datetime(),
  location:   z.string().optional(),
});

export const SemesterTimetableJSON = z.object({
  semesterId:   z.string(),                // resolved cuid
  academicYear: z.string().optional(),
  semesterNo:   z.number().int().min(1).max(2).optional(),
  titleTable:   z.array(z.object({
    courseCode: z.string(),
    courseName: z.string(),
    indexHints: z.array(z.string()).optional(),
    exam:       ZExam.optional(),
  })).optional(),
  classes: z.array(ZClassSlot),
  exams:   z.array(ZExam).optional(),
});

export type SemesterTimetableJSON = z.infer<typeof SemesterTimetableJSON>;
export type ZClassSlot = z.infer<typeof ZClassSlot>;
