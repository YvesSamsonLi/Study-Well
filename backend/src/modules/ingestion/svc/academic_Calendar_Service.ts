// src/modules/ingestion/svc/academic_Calendar_Service.ts
import path from "node:path";
import * as fs from "node:fs/promises";
import { prisma } from "../../../core/db/prisma";

import { extractTextFromPdfBytes } from "../../calendar/svc/text_Extractor";
import {
  parseAcademicCalendarText,
  ensureWeeksIfMissing,
  AcademicCalendarJSON,
} from "../../calendar/svc/academic_Parser";

import {
  createAcademicCalendarFile,
  materializeAcademicEventsFromParsed,
} from "../repo/academic_File";

/** ---------- helpers: AY + dates ---------- */
function ayShortFrom(text?: string | null): string | null {
  if (!text) return null;
  const m =
    /AY\s*(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/i.exec(text) ||
    /Academic\s*Year\s*(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/i.exec(text);
  return m ? `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}` : null;
}
const ayLongFromShort = (s: string) => `AY${s}`;
const asUTC = (iso: string) => new Date(iso + (iso.includes("T") ? "" : "T00:00:00Z"));
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);
const month = (d: Date) => d.getUTCMonth(); // 0..11
const dow = (d: Date) => d.getUTCDay(); // 0..6 (Sun..Sat)
const addDays = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
const firstDowOnOrAfter = (y: number, m: number, targetDow: number, startDay = 1) => {
  const d = new Date(Date.UTC(y, m, startDay));
  const delta = (targetDow - dow(d) + 7) % 7;
  return addDays(d, delta);
};
const firstMondayOnOrAfter = (y: number, m: number, startDay = 1) =>
  firstDowOnOrAfter(y, m, 1, startDay); // Mon=1

/** ---------- types from parser ---------- */
type ParsedWeek = {
  label?: string;
  kind: "TEACHING_WEEK" | "RECESS_WEEK" | "STUDY_WEEK" | "EXAM_WEEK";
  weekNo: number | null;
  startsOn: string;
  endsOn: string;
};

type ParsedHoliday = {
  title: string;
  date: string; // YYYY-MM-DD
};

/** ---------- fallback: holidays from OCR table ---------- */
function parsePublicHolidaysFromText(text: string): ParsedHoliday[] {
  // Only capture these 10 canonical names (output will use exactly these forms)
  const allowedCanonical = new Set([
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
  ]);

  // Map common variants to our canonical output
  const normalizeTitle = (raw: string): string | null => {
    const s = raw.trim().replace(/\s+/g, " ").toLowerCase();
    const map: Record<string, string> = {
      "national day": "National Day",
      "deepavali": "Deepavali",
      "diwali": "Deepavali",
      "christmas day": "Christmas Day",
      "new year's day": "New Year's Day",
      "new years day": "New Year's Day",
      "chinese new year": "Chinese New Year",
      "hari raya puasa": "Hari Raya Puasa",
      "good friday": "Good Friday",
      "labour day": "Labour Day",
      "labor day": "Labour Day",
      "hari raya haji": "Hari Raya Haji",
      "vesak day": "Vesak Day",
    };
    const canon = map[s];
    return canon && allowedCanonical.has(canon) ? canon : null;
  };

  // Focus parsing around "Singapore Public Holidays" section if present
  const anchorIdx = text.search(/SINGAPORE PUBLIC HOLIDAYS/i);
  const region = anchorIdx >= 0 ? text.slice(anchorIdx) : text;

  // Examples we need to match:
  //  - "National Day   9 Aug 2025 (Sat)*"
  //  - "Chinese New Year   17 - 18 Feb 2026 (Tue-Wed)"
  // We’ll support single date OR "d - d Mon YYYY"
  const re =
    /([A-Za-z'\/&\.\-\s]+?)\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s+([A-Za-z]{3,9})\s+(20\d{2})/g;

  const monMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const results: ParsedHoliday[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = re.exec(region)) !== null) {
    const rawTitle = m[1].replace(/\([^)]*\)|\*+/g, "").trim(); // strip (Sat)* etc.
    const canon = normalizeTitle(rawTitle);
    if (!canon) continue; // skip non-whitelisted holidays

    const dayStart = parseInt(m[2], 10);
    const dayEndRaw = m[3]; // may be undefined
    const monStr = m[4].toLowerCase();
    const year = parseInt(m[5], 10);
    const mi = monMap[monStr];
    if (mi == null) continue;

    const pushDay = (d: number) => {
      const date = new Date(Date.UTC(year, mi, d));
      const iso = date.toISOString().slice(0, 10);
      const key = `${canon}|${iso}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ title: canon, date: iso });
      }
    };

    // Expand ranges only for entries like "17 - 18 Feb 2026"
    if (dayEndRaw) {
      const dayEnd = parseInt(dayEndRaw, 10);
      for (let d = dayStart; d <= dayEnd; d++) pushDay(d);
    } else {
      pushDay(dayStart);
    }
  }

  return results;
}

/** ---------- fallback: synthesize weeks if parser returned none ---------- */
function synthesizeWeeksFromAY(short: string): ParsedWeek[] {
  const y1 = 2000 + parseInt(short.split("/")[0], 10);
  const y2 = y1 + 1;

  const weeks: ParsedWeek[] = [];

  const pushTW = (arr: ParsedWeek[], weekNo: number, start: Date) => {
    arr.push({
      kind: "TEACHING_WEEK",
      weekNo,
      startsOn: fmtISO(start),
      endsOn: fmtISO(addDays(start, 6)),
      label: `Teaching Week ${weekNo}`,
    });
  };

  const pushBlock = (
    arr: ParsedWeek[],
    kind: "RECESS_WEEK" | "STUDY_WEEK" | "EXAM_WEEK",
    start: Date,
    label: string
  ) => {
    arr.push({
      kind,
      weekNo: null,
      startsOn: fmtISO(start),
      endsOn: fmtISO(addDays(start, 6)),
      label,
    });
  };

  // ========== SEMESTER 1 (Mon–Sun) ==========
  // W1 starts Monday ON/AFTER 11 Aug
  const sem1: ParsedWeek[] = [];
  let cur = firstMondayOnOrAfter(y1, 7, 11); // Aug=7

  // W1..W7
  for (let i = 1; i <= 7; i++) {
    pushTW(sem1, i, cur);
    cur = addDays(cur, 7);
  }

  // Recess AFTER W7 (one full week)
  pushBlock(sem1, "RECESS_WEEK", cur, "Recess Week");
  cur = addDays(cur, 7); // Monday after Recess

  // W8..W13
  for (let i = 8; i <= 13; i++) {
    pushTW(sem1, i, cur);
    cur = addDays(cur, 7);
  }

  // Study Week (week after W13)
  const study1Start = cur; // immediately after W13
  pushBlock(sem1, "STUDY_WEEK", study1Start, "Study Week");

  // Exam Weeks: next two consecutive weeks after Study Week
  const exam1Start = addDays(study1Start, 7);
  const exam2Start = addDays(study1Start, 14);
  pushBlock(sem1, "EXAM_WEEK", exam1Start, "Revision & Examination");
  pushBlock(sem1, "EXAM_WEEK", exam2Start, "Revision & Examination");

  weeks.push(...sem1);

  // ========== SEMESTER 2 (Mon–Sun) ==========
  // Start at second Monday of January
  const sem2: ParsedWeek[] = [];
  const janFirstMon = firstMondayOnOrAfter(y2, 0, 1);
  cur = addDays(janFirstMon, 7); // second Monday

  // W1..W7
  for (let i = 1; i <= 7; i++) {
    pushTW(sem2, i, cur);
    cur = addDays(cur, 7);
  }

  // Recess AFTER W7 (one full week)
  pushBlock(sem2, "RECESS_WEEK", cur, "Recess Week");
  cur = addDays(cur, 7);

  // W8..W13
  for (let i = 8; i <= 13; i++) {
    pushTW(sem2, i, cur);
    cur = addDays(cur, 7);
  }

  // Study Week (week after W13)
  const study2Start = cur;
  pushBlock(sem2, "STUDY_WEEK", study2Start, "Study Week");

  // Exam Weeks: next two consecutive weeks after Study Week
  const exam21Start = addDays(study2Start, 7);
  const exam22Start = addDays(study2Start, 14);
  pushBlock(sem2, "EXAM_WEEK", exam21Start, "Revision & Examination");
  pushBlock(sem2, "EXAM_WEEK", exam22Start, "Revision & Examination");

  weeks.push(...sem2);

  return weeks;
}


/** When parser returns empty, improve with OCR-driven holidays + synthesized week blocks */
function enrichParsedWithFallbacks(parsed: AcademicCalendarJSON, text: string): AcademicCalendarJSON {
  if (!parsed.holidays || parsed.holidays.length === 0) {
    (parsed as any).holidays = parsePublicHolidaysFromText(text);
  }
  if (!parsed.weeks || parsed.weeks.length === 0) {
    const short = ayShortFrom(parsed.academicYear) || ayShortFrom(text);
    if (short) (parsed as any).weeks = synthesizeWeeksFromAY(short);
  }
  return parsed;
}


/** ---------- service ---------- */
export class AcademicCalendarService {
  private tempDir = "tmp/Academic_Calendar/uploads";
  private debugDir = "tmp/Academic_Calendar/debug";

  private async resolveSemesterId(semesterKey?: string): Promise<string> {
    if (!semesterKey) throw new Error(`Semester not found: missing id/name`);
    const byDirect = await prisma.semester.findFirst({
      where: { OR: [{ id: semesterKey }, { name: semesterKey }] },
      select: { id: true },
    });
    if (byDirect) return byDirect.id;

    const m = /^AY(\d{2})S([12])$/i.exec(semesterKey);
    if (m) {
      const yy = Number(m[1]);
      const semNo = Number(m[2]);
      const short = `${String(yy).padStart(2, "0")}/${String((yy + 1) % 100).padStart(2, "0")}`;
      const byShort = await prisma.semester.findFirst({
        where: { academicYearShort: short, semesterNo: semNo },
        select: { id: true },
      });
      if (byShort) return byShort.id;
    }
    throw new Error(
      `Semester not found for key "${semesterKey}". Pass a valid Semester.id or Semester.name (e.g. "AY25/26 Sem 1").`
    );
  }

  private async ensureSemestersFromText(text: string): Promise<Record<1 | 2, string>> {
    const short = ayShortFrom(text);
    if (!short) throw new Error(`Cannot infer academic year from OCR text`);
    const longAy = ayLongFromShort(short);

    const y1 = 2000 + parseInt(short.split("/")[0], 10);
    const y2 = y1 + 1;

    const ids: Partial<Record<1 | 2, string>> = {};
    for (const [no, sY, sM, sD, eY, eM, eD] of [
      [1, y1, 7, 1, y1, 11, 31] as const, // Aug 1 – Dec 31
      [2, y2, 0, 1, y2, 4, 31] as const,  // Jan 1 – May 31
    ]) {
      const name = `${longAy} Sem ${no}`;
      const s = await prisma.semester.upsert({
        where: { name },
        update: {
          academicYearShort: short,
          academicYear: longAy,
          semesterNo: no as 1 | 2,
          startsOn: new Date(Date.UTC(sY, sM, sD)),
          endsOn: new Date(Date.UTC(eY, eM, eD)),
        },
        create: {
          name,
          academicYearShort: short,
          academicYear: longAy,
          semesterNo: no as 1 | 2,
          startsOn: new Date(Date.UTC(sY, sM, sD)),
          endsOn: new Date(Date.UTC(eY, eM, eD)),
        },
        select: { id: true },
      });
      ids[no as 1 | 2] = s.id;
    }
    return ids as Record<1 | 2, string>;
  }

  private pickSemesterBucket(parsedWeeks: ParsedWeek[]): 1 | 2 {
    const w = parsedWeeks.map(x => asUTC(x.startsOn));
    if (!w.length) return 1;
    const sem1Months = new Set([7, 8, 9, 10, 11]); // Aug..Dec → 7..11 (0-based)
    const sem2Months = new Set([0, 1, 2, 3, 4]);  // Jan..May
    const c1 = w.filter(d => sem1Months.has(month(d))).length;
    const c2 = w.filter(d => sem2Months.has(month(d))).length;
    return c2 > c1 ? 2 : 1;
  }

  async uploadAndParse(opts: {
    semesterKey?: string;
    defaultYear?: number;
    altYear?: number;
    termName?: string;
    academicYear?: string;
    studentId: string;
    originalFilename: string;
    buffer: Buffer;
    mimeType: string;
  }) {
    const {
      semesterKey,
      defaultYear,
      altYear,
      termName,
      academicYear,
      studentId,
      originalFilename,
      buffer,
      mimeType,
    } = opts;

    // Persist bytes
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.debugDir, { recursive: true }).catch(() => {});
    const safeName = originalFilename.replace(/[^\w.\-() ]+/g, "_");
    const tmpPath = path.join(this.tempDir, `acal_${Date.now()}_${safeName}`);
    const rawForDb = Buffer.from(buffer);
    await fs.writeFile(tmpPath, rawForDb);

    // Extract embedded text
    const { text, used } = await extractTextFromPdfBytes(buffer);
    await fs.writeFile(path.join(this.debugDir, `academic_${Date.now()}.txt`), text).catch(() => {});

    // If semesterKey not provided → infer AY and ensure both semesters exist
    let resolvedSemesterId: string | null = null;
    let semMap: Record<1 | 2, string> | null = null;
    if (semesterKey) {
      resolvedSemesterId = await this.resolveSemesterId(semesterKey);
    } else {
      semMap = await this.ensureSemestersFromText(text);
    }

    // Infer default/alt years from AY if missing (stabilizes parsing)
    const short = ayShortFrom(academicYear) || ayShortFrom(text) || null;
    const def = defaultYear ?? (short ? 2000 + parseInt(short.split("/")[0], 10) : undefined);
    const alt = altYear ?? (def ? def + 1 : undefined);

    // Parse using your existing parser
    let parsed = parseAcademicCalendarText({
      semesterId: resolvedSemesterId || "TEMP",
      text,
      defaultYear: def,
      altYear: alt,
      termName,
      academicYear: short ? ayLongFromShort(short) : academicYear,
    });

    parsed = await ensureWeeksIfMissing(parsed);

    // Fallbacks: holidays from OCR table + synthesized weeks if still empty
    parsed = enrichParsedWithFallbacks(parsed, text);

    // If semester not provided, decide bucket from parsed weeks and use that cuid
    if (!resolvedSemesterId && semMap) {
      const bucket = this.pickSemesterBucket(parsed.weeks as ParsedWeek[]);
      resolvedSemesterId = semMap[bucket];
      (parsed as any).semesterId = resolvedSemesterId;
    }

    // Store file record
    const rec = await createAcademicCalendarFile({
      semesterKey: resolvedSemesterId!, // cuid
      studentId,
      filePath: tmpPath,
      fileName: originalFilename,
      mimeType,
      sizeBytes: rawForDb.length,
      content: rawForDb,
      textContent: text,
      extractedJson: parsed,
    });

    // Materialize rows
   await materializeAcademicEventsFromParsed(resolvedSemesterId!, parsed, studentId);


    return {
      fileId: rec.id,
      semesterId: resolvedSemesterId,
      used,
    };
  }
}
