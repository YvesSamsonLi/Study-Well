// src/modules/ingestion/repo/semester_Events.ts
import { materializeTimetable } from "../../calendar/svc/materialize_Timetable";

export async function expandSemesterClassesToEvents(studentId: string, semesterId: string) {
  return materializeTimetable(studentId, semesterId);
}
