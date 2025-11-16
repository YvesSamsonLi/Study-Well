import { fold, esc } from "../../../core/util/ics";

/**
 * Render a minimal VCALENDAR with multiple VEVENTs.
 * - UID is stable: <our-id>@studywell
 * - Times are UTC (Z suffix). For TZ support, add VTIMEZONE later.
 */
export function renderIcs(
  calendarName: string,
  events: Array<{ id: string; title: string; startAt: Date; endAt: Date }>
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudyWell//EN",
    `X-WR-CALNAME:${esc(calendarName)}`
  ];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@studywell`,
      `DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${toUTC(e.startAt)}`,
      `DTEND:${toUTC(e.endAt)}`,
      `SUMMARY:${esc(e.title)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return fold(lines.join("\r\n")); // fold long lines to satisfy RFC5545
}

/** Compact UTC timestamp formatter (YYYYMMDDTHHMMSSZ). */
function toUTC(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
