import { prisma } from "../../../core/db/prisma";
import { AcademicCalendarJSON } from "../../calendar/schema/Academic";

export async function replaceAcademicEventsFromJson(termId: string, json: AcademicCalendarJSON) {
  // Clear term’s previous facts to keep idempotency
  await prisma.academicCalEvent.deleteMany({ where: { termId } });

  // Expand week ranges → daily rows
  const items: Parameters<typeof prisma.academicCalEvent.createMany>[0]["data"] = [];

  const toDays = (startISO: string, endISO: string) => {
    const s = new Date(startISO + "T00:00:00Z");
    const e = new Date(endISO + "T00:00:00Z");
    const days: string[] = [];
    for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(d.toISOString().slice(0,10));
    }
    return days;
  };

  for (const w of json.weeks) {
    for (const dayISO of toDays(w.startDate, w.endDate)) {
      const d = new Date(dayISO + "T00:00:00Z");
      const month = d.getUTCMonth() + 1;
      const weekday = ((d.getUTCDay() + 6) % 7) + 1; // 1=Mon..7=Sun
      items.push({
        termId,
        day: new Date(dayISO + "T00:00:00Z"),
        kind: w.kind as any,
        title: w.label,
        notes: null,
        weekNo: w.weekNo ?? null,
        month,
        weekday,
      });
    }
  }

  for (const h of json.holidays) {
    const d = new Date(h.date + "T00:00:00Z");
    items.push({
      termId,
      day: d,
      kind: "PUBLIC_HOLIDAY" as any,
      title: h.name,
      notes: null,
      weekNo: null,
      month: d.getUTCMonth() + 1,
      weekday: ((d.getUTCDay() + 6) % 7) + 1,
    });
  }

  if (items.length) {
    await prisma.academicCalEvent.createMany({ data: items, skipDuplicates: true });
  }
}
