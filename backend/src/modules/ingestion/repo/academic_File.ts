import { prisma } from "../../../core/db/prisma";
import { AcademicCalendarJSON } from "../../calendar/svc/academic_Parser";
import { AcademicType, EventSource } from "@prisma/client"; // ← include EventSource

const TITLE_MAX = 180;
const NOTES_MAX = 1000;

const clip = (s: string) =>
  !s ? s : s.length <= TITLE_MAX ? s : s.slice(0, TITLE_MAX - 1) + "…";

const overflow = (s: string) => {
  if (!s) return undefined;
  if (s.length <= TITLE_MAX) return undefined;
  const capped = s.length > NOTES_MAX ? s.slice(0, NOTES_MAX - 1) + "…" : s;
  return capped;
};

// Convenience: make end-of-day (23:59:59.999Z) for MainCalendar ranges
const endOfDayUtc = (d: Date) => {
  const e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return e;
};

const toKind = (k: string): AcademicType => {
  switch (k) {
    case "RECESS_WEEK":     return "RECESS_WEEK";
    case "STUDY_WEEK":      return "STUDY_WEEK";
    case "EXAM_WEEK":       return "EXAM_WEEK";
    case "PUBLIC_HOLIDAY":  return "PUBLIC_HOLIDAY";
    default:                return "TEACHING_WEEK";
  }
};

/** Create file record (Semester-aware), resolving semester by id or name */
export async function createAcademicCalendarFile(opts: {
  semesterKey: string;
  studentId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: Buffer;
  textContent?: string | null;
  extractedJson?: AcademicCalendarJSON | null;
}) {
  const {
    semesterKey,
    studentId,
    filePath,
    fileName,
    mimeType,
    sizeBytes,
    content,
    textContent,
    extractedJson,
  } = opts;

  const sem =
    (await prisma.semester.findFirst({
      where: { OR: [{ id: semesterKey }, { name: semesterKey }] },
      select: { id: true },
    })) || null;
  if (!sem) throw new Error(`Semester not found for key "${semesterKey}"`);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) throw new Error(`Student not found for id "${studentId}"`);

  return prisma.academicCalendarFile.create({
    data: {
      semesterId: sem.id,
      studentId: student.id,
      filePath,
      fileName,
      mimeType,
      sizeBytes,
      content,
      textContent,
      extractedJson,
    },
  });
}

/**
 * Upsert weeks + holidays into AcademicCalEvent, then mirror each row into MainCalendar
 * for the same student (source = ACADEMIC), using externalId = AcademicCalEvent.id.
 */
export async function materializeAcademicEventsFromParsed(
  semesterId: string,
  parsed: AcademicCalendarJSON,
  studentId: string
) {
  // ---------- Weeks (range) ----------
  for (const w of parsed.weeks) {
    const starts = new Date(w.startsOn);
    const ends   = new Date(w.endsOn);
    const kind   = toKind(w.kind);

    const rawTitle =
      kind === "TEACHING_WEEK"
        ? `Teaching Week ${w.weekNo}`
        : (w.label ??
           w.kind.replace(/_/g, " ")
                 .toLowerCase()
                 .replace(/\b\w/g, s => s.toUpperCase()));

    const title = clip(rawTitle);
    const notes = overflow(rawTitle);

    // Use the NEW unique key: semesterId_startsOn_kind
    const ev = await prisma.academicCalEvent.upsert({
      where: { semesterId_startsOn_kind: { semesterId, startsOn: starts, kind } },
      update: {
        title,
        notes,
        weekNo: w.weekNo ?? null,
        month: starts.getUTCMonth() + 1,
        weekday: 1, // Monday anchor for weeks
        endsOn: ends,
      },
      create: {
        semesterId,
        kind,
        title,
        notes,
        weekNo: w.weekNo ?? null,
        startsOn: starts,
        endsOn: ends,
        month: starts.getUTCMonth() + 1,
        weekday: 1,
      },
      select: { id: true, startsOn: true, endsOn: true, title: true },
    });

    // Mirror into MainCalendar for this student
    await prisma.mainCalendar.upsert({
      where: {
        // unique: @@unique([studentId, source, externalId, startsAt])
        studentId_source_externalId_startsAt: {
          studentId,
          source: "ACADEMIC",
          externalId: ev.id,
          startsAt: ev.startsOn,
        },
      },
      update: {
        title: ev.title,
        startsAt: ev.startsOn,
        endsAt: endOfDayUtc(ev.endsOn),
        source: "ACADEMIC",
        semesterId,
        description: undefined,
        location: undefined,
      },
      create: {
        title: ev.title,
        startsAt: ev.startsOn,
        endsAt: endOfDayUtc(ev.endsOn),
        source: "ACADEMIC" as EventSource,
        semesterId,
        studentId,
        externalId: ev.id,
        description: undefined,
        location: undefined,
      },
    });
  }

  // ---------- Holidays (single-day, but still use range columns) ----------
  for (const h of parsed.holidays) {
    const d = new Date(h.date);
    const kind: AcademicType = "PUBLIC_HOLIDAY";
    const title = clip(h.title);

    const ev = await prisma.academicCalEvent.upsert({
      where: { semesterId_startsOn_kind: { semesterId, startsOn: d, kind } },
      update: {
        title,
        notes: undefined,
        month: d.getUTCMonth() + 1,
        weekday: ((d.getUTCDay() + 6) % 7) + 1,
        endsOn: d,
      },
      create: {
        semesterId,
        kind,
        title,
        notes: undefined,
        startsOn: d,
        endsOn: d,
        month: d.getUTCMonth() + 1,
        weekday: ((d.getUTCDay() + 6) % 7) + 1,
      },
      select: { id: true, startsOn: true, endsOn: true, title: true },
    });

    await prisma.mainCalendar.upsert({
      where: {
        studentId_source_externalId_startsAt: {
          studentId,
          source: "ACADEMIC",
          externalId: ev.id,
          startsAt: ev.startsOn,
        },
      },
      update: {
        title: ev.title,
        startsAt: ev.startsOn,
        endsAt: endOfDayUtc(ev.endsOn),
        source: "ACADEMIC",
        semesterId,
      },
      create: {
        title: ev.title,
        startsAt: ev.startsOn,
        endsAt: endOfDayUtc(ev.endsOn),
        source: "ACADEMIC" as EventSource,
        semesterId,
        studentId,
        externalId: ev.id,
      },
    });
  }
}
