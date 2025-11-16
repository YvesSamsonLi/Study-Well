// src/modules/calendar/svc/materialize_Timetable.ts
import { prisma } from "../../../core/db/prisma";
import { addDays } from "date-fns";

type MaterializeOpts = {
  studentId: string;
  semesterId: string;
  // accepted but currently unused; keeps API flexible
  parsed?: any;
  source?: "USER" | "ACADEMIC" | "TIMETABLE";
};

// Helper: combine YYYY-MM-DD (from a Date) with "HH:MM"
function combineDateTime(baseDateUTC: Date, timeHHMM: string): Date {
  const [hh, mm] = timeHHMM.split(":").map((s) => parseInt(s, 10));
  const d = new Date(
    Date.UTC(
      baseDateUTC.getUTCFullYear(),
      baseDateUTC.getUTCMonth(),
      baseDateUTC.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  d.setUTCHours(hh, mm, 0, 0);
  return d;
}

function expandWeeks(raw: string): number[] {
  const txt = raw.replace(/^Wk/i, "").trim();
  const parts = txt.split(",").map((s) => s.trim()).filter(Boolean);
  const out: number[] = [];
  for (const p of parts) {
    const m = /^(\d+)-(\d+)$/.exec(p);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      for (let x = Math.min(a, b); x <= Math.max(a, b); x++) out.push(x);
    } else if (/^\d+$/.test(p)) {
      out.push(Number(p));
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/**
 * Materialize timetable CourseClass rows into per-session Event rows for a student.
 * Uses semesterId. Idempotent via Event unique index.
 */
export async function materializeTimetable(opts: MaterializeOpts) {
  const { studentId, semesterId } = opts;

  // 1) Get semester anchor (startsOn = Monday of Week 1)
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
    select: { id: true, startsOn: true, name: true },
  });
  if (!semester) throw new Error(`Semester not found: ${semesterId}`);

  // 2) Get all classes for this semester
  const classes = await prisma.courseClass.findMany({
    where: { semesterId },
    select: {
      id: true,
      courseId: true,
      component: true,
      index: true,
      dayOfWeek: true, // 1..7 (Mon..Sun)
      startTime: true, // "HH:MM"
      endTime: true,   // "HH:MM"
      weeksJson: true, // '["1",2,...]' OR "Wk1-9,11-13"
      location: true,
      course: { select: { code: true, name: true } },
    },
  });

  let eventsCreated = 0;
  let eventsUpdated = 0;
  let mainCalendarCreated = 0;
  let mainCalendarUpdated = 0;

  for (const c of classes) {
    // Parse weeks from JSON or compact string
    let weeks: number[] = [];
    try {
      const parsed = JSON.parse(c.weeksJson || "[]");
      if (Array.isArray(parsed)) {
        weeks = parsed.map(Number).filter((n) => Number.isInteger(n));
      }
    } catch {
      // ignore; not JSON
    }
    if (!weeks.length && (c.weeksJson ?? "").trim()) {
      weeks = expandWeeks(c.weeksJson);
    }
    if (!weeks.length) continue;

    for (const w of weeks) {
      // Week w Monday = startsOn + (w-1)*7 days
      const mondayOfWeekW = addDays(semester.startsOn, (w - 1) * 7);
      // Session date = Monday + (dayOfWeek-1)
      const sessionDate = addDays(mondayOfWeekW, c.dayOfWeek - 1);

      const startsAt = combineDateTime(sessionDate, c.startTime);
      const endsAt = combineDateTime(sessionDate, c.endTime);

      const title = `${c.course.code} ${c.component} (${c.index})`;
      const notes = c.course.name;

      // Check existence for counters
      const existingEvent = await prisma.event.findUnique({
        where: {
          studentId_source_externalId_startsAt: {
            studentId,
            source: "TIMETABLE",
            externalId: c.id,
            startsAt,
          },
        },
        select: { id: true },
      });

      // 3) Upsert into Event (idempotent)
      await prisma.event.upsert({
        where: {
          studentId_source_externalId_startsAt: {
            studentId,
            source: "TIMETABLE",
            externalId: c.id,
            startsAt,
          },
        },
        update: {
          endsAt,
          location: c.location ?? undefined,
          courseCode: c.course.code,
          classType: c.component,
          classIndex: c.index,
          semesterId,
          title,
          notes,
          isLocked: true,
          source: "TIMETABLE",
        },
        create: {
          studentId,
          title,
          startsAt,
          endsAt,
          location: c.location ?? undefined,
          category: "Class",
          notes,
          source: "TIMETABLE",
          isLocked: true,
          externalId: c.id,
          semesterId,
          courseCode: c.course.code,
          classType: c.component,
          classIndex: c.index,
        },
      });

      if (existingEvent) {
        eventsUpdated += 1;
      } else {
        eventsCreated += 1;
      }

      // 4) Mirror into MainCalendar (clean find/update/create)
      const existingMC = await prisma.mainCalendar.findFirst({
        where: {
          studentId,
          source: "TIMETABLE",
          externalId: c.id,
          startsAt,
        },
        select: { id: true },
      });

      if (existingMC) {
        await prisma.mainCalendar.update({
          where: { id: existingMC.id },
          data: {
            endsAt,
            location: c.location ?? undefined,
            description: notes,
          },
        });
        mainCalendarUpdated += 1;
      } else {
        await prisma.mainCalendar.create({
          data: {
            semesterId,
            studentId,
            title,
            startsAt,
            endsAt,
            location: c.location ?? undefined,
            description: notes,
            source: "TIMETABLE",
            externalId: c.id,
            isSynced: false,
          },
        });
        mainCalendarCreated += 1;
      }
    }
  }

  return {
    classesProcessed: classes.length,
    eventsCreated,
    eventsUpdated,
    mainCalendarCreated,
    mainCalendarUpdated,
  };
}
