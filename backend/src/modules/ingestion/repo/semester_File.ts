import { prisma } from "../../../core/db/prisma";
import { SemesterTimetableJSON } from "../../calendar/schema/semester_Timetable";
import { ClassType, DeliveryMode } from "@prisma/client";

export async function createSemesterCalendarFile(opts: {
  semesterKey: string;  // cuid or Semester.name
  studentId:   string;
  filePath:    string;
  fileName:    string;
  mimeType:    string;
  sizeBytes:   number;
  content:     Buffer;
  textContent?: string | null;
  extractedJson?: SemesterTimetableJSON | null;
}) {
  const { semesterKey, studentId } = opts;

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

  return prisma.semesterCalendarFile.create({
    data: {
      semesterId: sem.id,
      studentId: student.id,
      filePath: opts.filePath,
      fileName: opts.fileName,
      mimeType: opts.mimeType,
      sizeBytes: opts.sizeBytes,
      content: opts.content,
      textContent: opts.textContent ?? null,
      extractedJson: opts.extractedJson ?? null,
    },
  });
}

/** Idempotent upsert of Course, CourseClass, CourseExam from parsed JSON. */
export async function materializeSemesterTimetable(parsed: SemesterTimetableJSON) {
  const { semesterId, classes = [], exams = [] } = parsed;

  // COURSES + CLASSES
  for (const c of classes) {
    const code = c.courseCode.trim();
    // course name may be unknown at this stage
    const course = await upsertCourseByCode(code);

    // Upsert CourseClass (unique: [semesterId, index, component, dayOfWeek, startTime, endTime])
    const component = (c.component as keyof typeof ClassType) in ClassType ? c.component as any : "OTHER";
    const start = normalize(c.startTime);
    const end   = normalize(c.endTime);

    await prisma.courseClass.upsert({
      where: {
        semesterId_index_component_dayOfWeek_startTime_endTime: {
          semesterId,
          index: c.groupIndex,
          component,
          dayOfWeek: c.dayOfWeek,
          startTime: start,
          endTime: end,
        },
      },
      update: {
        courseId: course.id,
        weeksJson: c.weekSpec.weeks ? JSON.stringify(c.weekSpec.weeks) : c.weekSpec.raw,
        location: c.location,
        delivery: toDeliveryMode(c.delivery, c.location),
      },
      create: {
        courseId: course.id,
        semesterId,
        index: c.groupIndex,
        component,
        dayOfWeek: c.dayOfWeek,
        startTime: start,
        endTime: end,
        weeksJson: c.weekSpec.weeks ? JSON.stringify(c.weekSpec.weeks) : c.weekSpec.raw,
        location: c.location,
        delivery: toDeliveryMode(c.delivery, c.location),
      },
    });
  }

  // EXAMS
  for (const e of exams) {
    const course = await upsertCourseByCode(e.courseCode.trim());
    await prisma.courseExam.upsert({
      where: {
        courseId_startsAt_endsAt: {
          courseId: course.id,
          startsAt: new Date(e.startsAt),
          endsAt:   new Date(e.endsAt),
        },
      },
      update: { location: e.location ?? null, semesterId },
      create: {
        courseId: course.id,
        semesterId,
        startsAt: new Date(e.startsAt),
        endsAt:   new Date(e.endsAt),
        location: e.location ?? null,
      },
    });
  }
}

async function upsertCourseByCode(code: string) {
  const placeholder = `${code} Course`;
  const found = await prisma.course.findFirst({ where: { code } });
  if (found) return found;

  return prisma.course.create({ data: { code, name: placeholder } });
}

function normalize(t: string) {
  return t.includes(":") ? t : `${t.slice(0,2)}:${t.slice(2)}`;
}

function toDeliveryMode(d?: string, loc?: string | null): DeliveryMode | null {
  if (d && d in DeliveryMode) return d as DeliveryMode;
  if ((loc ?? "").toUpperCase() === "ONLINE") return "ONLINE";
  return "PHYSICAL";
}
