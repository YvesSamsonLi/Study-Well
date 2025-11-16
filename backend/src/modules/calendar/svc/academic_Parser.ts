// src/modules/calendar/svc/academic_Parser.ts
import { addDays, startOfDay } from "date-fns";
import { prisma } from "../../../core/db/prisma";

export type AcademicCalendarJSON = {
  semesterId: string;
  academicYear?: string;
  termName?: string;
  weeks: Array<{
    kind: "TEACHING_WEEK" | "RECESS_WEEK" | "STUDY_WEEK" | "EXAM_WEEK";
    weekNo?: number;
    startsOn: string;
    endsOn: string;
  }>;
  holidays: Array<{ title: string; date: string }>;
};

const MONTHS: Record<string, number> = {
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
};
const monNum = (s: string) => MONTHS[s.slice(0,3).toLowerCase()] ?? null;

/** ---- helpers to parse date tokens ---- */
function parseSingleDmyToken(tok: string, fallbackYear?: number): Date | null {
  const cleaned = tok.replace(/\(.+?\)\*?/g, "").trim();
  const m = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]), mon = monNum(m[2]), y = Number(m[3]) || fallbackYear;
  if (!mon || !y) return null;
  return new Date(Date.UTC(y, mon - 1, d));
}

function expandRangeToken(tok: string, fallbackYear?: number): Date[] | null {
  const cleaned = tok.replace(/\(.+?\)\*?/g, "").trim();
  const m = cleaned.match(/^(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return null;
  const d1 = Number(m[1]), d2 = Number(m[2]);
  const mon = monNum(m[3]); const y = Number(m[4]) || fallbackYear;
  if (!mon || !y) return null;
  const out: Date[] = [];
  for (let d = d1; d <= d2; d++) out.push(new Date(Date.UTC(y, mon - 1, d)));
  return out;
}

/** ---- holiday-table parser (title-anchored, two-column aware) ---- */
const KNOWN_PH_TITLES = [
  "National Day",
  "Deepavali",
  "Christmas Day",
  "New Year's Day",
  "Chinese New Year",
  "Hari Raya Puasa",
  "Good Friday",
  "Labour Day",
  "Hari Raya Haji",
  "Vesak Day",
];

// Accept hyphen OR en/em dash between range days, allow optional brackets after date
const RANGE_RE = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/;
const DATE_RE  = /\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/;

function normLine(s: string) {
  return s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}
const lc = (s: string) => s.toLowerCase();

function isTitleLine(line: string, titlesLC: Set<string>) {
  // exact cell line OR starts-with then many spaces (title + “right column”)
  const l = normLine(line);
  if (titlesLC.has(lc(l))) return true;
  for (const t of titlesLC) {
    const tit = t; // already lowercase
    if (lc(l).startsWith(tit + " ")) return true;   // "Title  <date>"
  }
  return false;
}

function datesFromToken(tok: string, fallbackYear?: number): Date[] | null {
  tok = tok.trim();
  // range first
  const rm = RANGE_RE.exec(tok);
  if (rm) {
    const d1 = Number(rm[1]), d2 = Number(rm[2]);
    const mon = (MONTHS[rm[3].slice(0,3).toLowerCase()] ?? null);
    const y   = Number(rm[4]) || fallbackYear;
    if (!mon || !y) return null;
    const out: Date[] = [];
    for (let d = d1; d <= d2; d++) out.push(new Date(Date.UTC(y, mon-1, d)));
    return out;
  }
  // single day
  const sm = DATE_RE.exec(tok);
  if (sm) {
    const d = Number(sm[1]);
    const mon = (MONTHS[sm[2].slice(0,3).toLowerCase()] ?? null);
    const y   = Number(sm[3]) || fallbackYear;
    if (!mon || !y) return null;
    return [new Date(Date.UTC(y, mon-1, d))];
  }
  return null;
}

function parsePublicHolidaysByTitles(text: string, defaultYear: number) {
  const out: { title: string; date: string }[] = [];
  const seen = new Set<string>();

  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/\u00A0/g, " ")) // NBSP -> space
    .map(l => l.replace(/\s+$/,""))      // trim right
    .filter(l => l.trim().length > 0);

  const titlesLC = new Set(KNOWN_PH_TITLES.map(lc));

  // Build a quick “line -> next token” search that prefers:
  //  1) same line after 2+ spaces
  //  2) within next 3 lines, unless another title is hit
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const rawLC = lc(normLine(raw));

    for (const title of KNOWN_PH_TITLES) {
      const titleLC = lc(title);

      // a) Same-line pattern: "<title>  <date/range>"
      const sameLine = new RegExp("^" + title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s{2,}(.+)$", "i").exec(raw);
      if (sameLine) {
        const token = sameLine[1].trim();
        const ds = datesFromToken(token, defaultYear);
        if (ds) {
          for (const d of ds) {
            const key = `${title}|${d.toISOString().slice(0,10)}`;
            if (!seen.has(key)) {
              seen.add(key);
              out.push({ title, date: d.toISOString() });
            }
          }
        }
        continue; // next title
      }

      // b) Title occupies its own line; date is in the next column line(s)
      if (rawLC === titleLC) {
        // look ahead up to 3 non-empty lines or until another title row
        for (let j = i + 1; j <= i + 3 && j < lines.length; j++) {
          const probe = lines[j].trim();
          if (!probe) continue;

          // if next line is another title row, stop searching for this title
          if (isTitleLine(probe, titlesLC)) break;

          const ds = datesFromToken(probe, defaultYear);
          if (ds) {
            for (const d of ds) {
              const key = `${title}|${d.toISOString().slice(0,10)}`;
              if (!seen.has(key)) {
                seen.add(key);
                out.push({ title, date: d.toISOString() });
              }
            }
            break; // found date for this title
          }
        }
      }
    }
  }

  return out;
}

/** ---- main parse entry ---- */
export function parseAcademicCalendarText(input: {
  semesterId: string;
  text: string;
  defaultYear: number;
  altYear?: number;
  termName?: string;
  academicYear?: string;
}): AcademicCalendarJSON {
  const { semesterId, text, defaultYear, termName, academicYear } = input;

  // Holidays: strictly from the PH table using title anchors
  const holidays = parsePublicHolidaysByTitles(text, defaultYear);

  // Weeks: still empty; synthesized below if missing
  const weeks: AcademicCalendarJSON["weeks"] = [];

  return { semesterId, academicYear, termName, weeks, holidays };
}

/** ---- synthesize weeks from Semester.startsOn when OCR didn’t capture them ---- */
export async function ensureWeeksIfMissing(parsed: AcademicCalendarJSON) {
  if (parsed.weeks.length > 0) return parsed;

  const semester = await prisma.semester.findUnique({
    where: { id: parsed.semesterId },
    select: { startsOn: true },
  });
  if (!semester) return parsed;

  const base = startOfDay(new Date(semester.startsOn));
  const range = (start: Date, days: number) => ({
    startsOn: start.toISOString(),
    endsOn: addDays(start, days - 1).toISOString(),
  });

  for (let w = 1; w <= 7; w++) {
    const start = addDays(base, (w - 1) * 7);
    parsed.weeks.push({ kind: "TEACHING_WEEK", weekNo: w, ...range(start, 7) });
  }
  parsed.weeks.push({ kind: "RECESS_WEEK", ...range(addDays(base, 7 * 7), 7) });
  for (let w = 8; w <= 13; w++) {
    const start = addDays(base, w * 7);
    parsed.weeks.push({ kind: "TEACHING_WEEK", weekNo: w, ...range(start, 7) });
  }
  parsed.weeks.push({ kind: "STUDY_WEEK", ...range(addDays(base, 14 * 7), 7) });
  parsed.weeks.push({ kind: "EXAM_WEEK", ...range(addDays(base, 15 * 7), 7) });
  parsed.weeks.push({ kind: "EXAM_WEEK", ...range(addDays(base, 16 * 7), 7) });

  return parsed;
}
