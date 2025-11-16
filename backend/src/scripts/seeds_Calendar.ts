// src/scripts/seeds_calendar.ts
import { prisma } from "../core/db/prisma";
import { materializeTimetable } from "../modules/calendar/svc/materialize_Timetable";

async function main() {
  const email = process.env.SEED_STUDENT_EMAIL ?? "John@student.edu";

  // 1. Get or fallback student
  let student = await prisma.student.findUnique({ where: { email } });
  if (!student) {
    student = await prisma.student.findFirst();
  }
  if (!student) throw new Error("No students found. Run auth seed first.");

  // 2. Upsert semester (formerly)
  const semester = await prisma.semester.upsert({
    where: { name: "AY25/26 Sem 1" },
    update: {},
    create: {
      name: "AY25/26 Sem 1",
      academicYearShort: "25/26",
      academicYear: "AY25/26",
      semesterNo: 1,
      startsOn: new Date("2025-08-11T00:00:00.000Z"),
      endsOn:   new Date("2025-12-01T00:00:00.000Z"),
    },
  });

  // 3️. Seed a few academic calendar events (e.g., recess/study/exam weeks)
  await prisma.academicCalEvent.createMany({
    data: [
      {
        semesterId: semester.id,
        day: new Date("2025-09-22"),
        kind: "RECESS_WEEK",
        title: "Recess Week starts",
      },
      {
        semesterId: semester.id,
        day: new Date("2025-10-27"),
        kind: "STUDY_WEEK",
        title: "Study Week starts",
      },
      {
        semesterId: semester.id,
        day: new Date("2025-11-03"),
        kind: "EXAM_WEEK",
        title: "Exam Week starts",
      },
    ],
    skipDuplicates: true,
  });

  // 4️. Seed courses
  const cz2006 = await prisma.course.upsert({
    where: { code_name: { code: "CZ2006", name: "Software Engineering" } },
    update: {},
    create: { code: "CZ2006", name: "Software Engineering" },
  });

  const cz1011 = await prisma.course.upsert({
    where: { code_name: { code: "CZ1011", name: "Discrete Math" } },
    update: {},
    create: { code: "CZ1011", name: "Discrete Math" },
  });

  // 5️. Seed course classes
  await prisma.courseClass.createMany({
    data: [
      {
        courseId: cz2006.id,
        semesterId: semester.id,
        index: "10234",
        component: "LEC",
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "11:30",
        weeksJson: JSON.stringify([1,2,3,4,5,7,8,9,10,11,12]),
        location: "LT1A",
      },
      {
        courseId: cz2006.id,
        semesterId: semester.id,
        index: "20456",
        component: "TUT",
        dayOfWeek: 3,
        startTime: "14:30",
        endTime: "15:30",
        weeksJson: JSON.stringify([1,2,3,4,5,7,8,9,10,11,12]),
        location: "TR+1",
      },
      {
        courseId: cz1011.id,
        semesterId: semester.id,
        index: "30001",
        component: "LEC",
        dayOfWeek: 4,
        startTime: "10:00",
        endTime: "12:00",
        weeksJson: JSON.stringify([1,2,3,4,5,7,8,9,10,11,12]),
        location: "LT2",
      },
    ],
    skipDuplicates: true,
  });

  // 6️. Enroll the student into all classes
  const classes = await prisma.courseClass.findMany({ where: { semesterId: semester.id } });
  for (const c of classes) {
    await prisma.timetableEnrollment.upsert({
      where: { studentId_classId: { studentId: student.id, classId: c.id } },
      update: {},
      create: {
        studentId: student.id,
        courseId: c.courseId,
        classId: c.id,
      },
    });
  }

  // 7️. Materialize timetable into unified Event/MainCalendar
  await materializeTimetable(student.id, semester.id);

  console.log(`✅ Calendar seed complete for ${student.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
