// src/modules/ingestion/svc/semester_Calendar_Service.ts
import path from "node:path";
import * as fs from "node:fs/promises";
import { prisma } from "../../../core/db/prisma";

// Import whatever the parser module exports; resolve at runtime below.
import * as SemesterParser from "../../calendar/svc/semester_Parser";
import { materializeTimetable } from "../../calendar/svc/materialize_Timetable";
import { extractTextFromPdfBytes } from "../../calendar/svc/text_Extractor";
import { extractTextWithLayout } from "../../calendar/svc/text_Extractor";


// ---------- local types (relaxed) ----------
type ParsedSemesterClass = {
  courseCode: string;
  component?: "LEC" | "TUT" | "LAB" | "SEM" | "OTHER" | string;
  groupIndex?: string;
  dayOfWeek?: number;            // 1..7
  startTime?: string;            // "HH:MM"
  endTime?: string;              // "HH:MM"
  location?: string | null;
  delivery?: "PHYSICAL" | "ONLINE" | "HYBRID" | string;
  weekSpec?: { weeks?: number[] } | any;
};

type ParsedCourseExam = {
  dateStr: string;               // "24-Nov-2025"
  startHHMM: string;             // "1700"
  endHHMM: string;               // "1900"
  location?: string | null;
};

type ParsedCourse = {
  code: string;
  name?: string;
  exam?: ParsedCourseExam;
};

type ParsedSemester = {
  semesterId?: string;
  courses?: ParsedCourse[];
  classes?: ParsedSemesterClass[];
  // some parsers may return "lessons"
  lessons?: ParsedSemesterClass[];
  // some parsers may return a table that includes names / exams
  courseTable?: Array<{ code: string; name?: string; exam?: ParsedCourseExam }>;
};

// ---------- dynamic parser shims (handles named/default/nested) ----------
const _SP: any = SemesterParser;

const _resolve = (obj: any, key: string) =>
  (obj && typeof obj[key] === "function" && obj[key]) ||
  (obj?.default && typeof obj.default[key] === "function" && obj.default[key]) ||
  (typeof obj?.default === "function" ? obj.default : null);

const parseSemesterTimetableFn:
  | ((arg:
      | { kind: "pdf-text"; text: string; semesterId?: string; defaultYear?: number; altYear?: number }
      | { kind: "ics"; buffer: Buffer; defaultYear?: number; altYear?: number }
      | { kind: "csv"; buffer: Buffer; defaultYear?: number; altYear?: number }
    ) => Promise<ParsedSemester>)
  | null = _resolve(_SP, "parseSemesterTimetable");

const parseSemesterTimetableTextFn:
  | ((arg: { semesterId?: string; text: string; defaultDayOfWeek?: number }) => Promise<ParsedSemester>)
  | null = _resolve(_SP, "parseSemesterTimetableText");

// ---------- helpers ----------
const _month = (mmm: string) =>
  ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].indexOf(mmm.toUpperCase());

const ayShortFrom = (text?: string | null): string | null => {
  if (!text) return null;
  const m =
    /AY\s*(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/i.exec(text) ||
    /Academic\s*Year\s*(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/i.exec(text);
  return m ? `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}` : null;
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ---------- layout → lines → weekday columns ----------
type LinePart = { x: number; t: string; start: number; end: number };
type Line = { page: number; y: number; minX: number; text: string; parts: LinePart[] };

function buildLines(tokens: {page:number;x:number;y:number;text:string}[]): Line[] {
  const byKey = new Map<string, { page:number; y:number; xs:number[]; rawParts:{x:number; t:string}[] }>();
  const yBucket = (y:number) => Math.round(y / 2); // vertical tolerance

  for (const t of tokens) {
    const key = `${t.page}:${yBucket(t.y)}`;
    const row = byKey.get(key) ?? { page: t.page, y: t.y, xs: [], rawParts: [] };
    row.rawParts.push({ x: t.x, t: t.text ?? "" });
    row.xs.push(t.x);
    byKey.set(key, row);
  }

  const lines: Line[] = [];
  for (const [, row] of byKey) {
    row.rawParts.sort((a,b) => a.x - b.x);

    // Build text and capture start/end indices for each token piece
    const parts: LinePart[] = [];
    let cursor = 0;
    let text = "";
    for (let i=0;i<row.rawParts.length;i++) {
      const piece = row.rawParts[i];
      const toAppend = (i === 0) ? piece.t : (" " + piece.t);
      const start = cursor + (i === 0 ? 0 : 1);
      const end = start + piece.t.length;
      text += toAppend;
      parts.push({ x: piece.x, t: piece.t, start, end });
      cursor = end;
    }

    // normalize whitespace
    const normalized = text.replace(/\s+/g, " ").trim();

   
    const stableText = (" " + row.rawParts.map(p => p.t).join(" ") + " ").replace(/\s+/g, " ");
    // Now recompute parts on stableText
    const stableParts: LinePart[] = [];
    let pos = 1;
    for (const piece of row.rawParts) {
      const start = pos;
      const end = start + piece.t.length;
      stableParts.push({ x: piece.x, t: piece.t, start, end });
      pos = end + 1; // for the single space we keep between tokens
    }

    lines.push({
      page: row.page,
      y: row.y,
      minX: Math.min(...row.xs),
      text: stableText, // clean for regex/search
      parts: stableParts,
    });
  }

  // page asc, y desc (top→down)
  lines.sort((a,b) => (a.page - b.page) || (b.y - a.y));
  return lines;
}

function xAt(line: Line, idxInLine: number): number {
  // find the part whose [start,end) spans idx; if none, pick nearest by start
  let best: LinePart | null = null;
  let bestD = Infinity;
  for (const p of line.parts) {
    if (idxInLine >= p.start && idxInLine < p.end) return p.x;
    const d = Math.min(Math.abs(idxInLine - p.start), Math.abs(idxInLine - p.end));
    if (d < bestD) { bestD = d; best = p; }
  }
  return best ? best.x : line.minX;
}

function detectDayColumnsFromTokens(tokens: {page:number;x:number;y:number;text:string}[]): DayCols | null {
  const DAYLAB = new Set(["MON","TUE","WED","THU","FRI","SAT","SUN"]);
  // bucket by page & y (so labels on close y’s are grouped)
  const yBucket = (y:number) => Math.round(y / 2);
  const byKey = new Map<string, { page:number; yb:number; items:{label:string;x:number}[] }>();

  for (const t of tokens) {
    const label = (t.text || "").trim().toUpperCase();
    if (!DAYLAB.has(label)) continue;
    const key = `${t.page}:${yBucket(t.y)}`;
    const row = byKey.get(key) ?? { page: t.page, yb: yBucket(t.y), items: [] };
    row.items.push({ label, x: t.x });
    byKey.set(key, row);
  }

  // pick the cluster with the most labels (usually the header row)
  let best: { page:number; yb:number; items:{label:string;x:number}[] } | null = null;
  for (const [, row] of byKey) {
    if (!best || row.items.length > best.items.length) best = row;
  }
  if (!best || best.items.length < 3) return null;

  const filtered = best.items
    .filter(it => ["MON","TUE","WED","THU","FRI","SAT"].includes(it.label))
    .sort((a,b) => a.x - b.x);

  if (!filtered.length) return null;
  return filtered.map((it, i) => ({ day: i+1, label: it.label, x: it.x }));
}



type DayCols = { day: number; label: string; x: number }[];

function detectDayColumns(lines: Line[]): DayCols | null {
  const DAYLAB = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  for (const ln of lines) {
    const hits: { label:string; x:number }[] = [];
    for (const label of DAYLAB) {
      const idx = ln.text.indexOf(label);
      if (idx >= 0) {
        const x = xAt(ln, idx);
        hits.push({ label, x });
      }
    }
    if (hits.length >= 3) {
      const map = hits
        .filter(h => ["MON","TUE","WED","THU","FRI","SAT"].includes(h.label))
        .sort((a,b) => a.x - b.x)
        .map((h,i) => ({ day: i+1, label: h.label, x: h.x }));
      if (map.length) return map;
    }
  }
  return null;
}


function pickDayByX(x: number, cols: DayCols): number {
  let best = cols[0];
  let bestD = Math.abs(x - cols[0].x);
  for (let i=1;i<cols.length;i++){
    const d = Math.abs(x - cols[i].x);
    if (d < bestD) { bestD = d; best = cols[i]; }
  }
  return best.day; // 1..6 (Mon..Sat)
}



// normalize whatever parser produced into stable {courses, classes}
function normalizeParsed(raw: ParsedSemester | null | undefined, semesterId: string): Required<Pick<ParsedSemester, "courses" | "classes">> & { semesterId: string } {
  const outCourses: ParsedCourse[] = [];
  const outClasses: ParsedSemesterClass[] = [];

  if (raw) {
    // prefer explicit arrays
    const courses = asArray<ParsedCourse>(raw.courses);
    const classes = asArray<ParsedSemesterClass>(raw.classes);
    const lessons = asArray<ParsedSemesterClass>(raw.lessons);
    const courseTable = asArray<{ code: string; name?: string; exam?: ParsedCourseExam }>(raw.courseTable);

    // collect classes from classes/lessons
    for (const c of [...classes, ...lessons]) {
      const cls: ParsedSemesterClass = {
        courseCode: String((c as any).courseCode ?? "").trim(),
        component: (c as any).component ?? "OTHER",
        groupIndex: (c as any).groupIndex ?? "1",
        dayOfWeek: Number((c as any).dayOfWeek ?? 1),
        startTime: (c as any).startTime ?? "08:30",
        endTime: (c as any).endTime ?? "09:20",
        location: (c as any).location ?? null,
        delivery: (c as any).delivery ?? "PHYSICAL",
        weekSpec: (c as any).weekSpec ?? { weeks: [] },
      };
      // guarantee shape
      if (!cls.weekSpec || !Array.isArray(cls.weekSpec.weeks)) cls.weekSpec = { weeks: [] };
      outClasses.push(cls);
    }

    // courses from provided courses
    for (const co of courses) {
      if (!co?.code) continue;
      outCourses.push({ code: co.code.trim(), name: co.name?.trim(), exam: co.exam });
    }

    // Augment courses from courseTable
    for (const r of courseTable) {
      if (!r?.code) continue;
      const code = r.code.trim();
      if (!outCourses.find(x => x.code === code)) {
        outCourses.push({ code, name: r.name?.trim(), exam: r.exam });
      }
    }

    // if still no courses, infer minimal ones from classes
    if (outCourses.length === 0 && outClasses.length > 0) {
      const uniq = new Set(outClasses.map(c => c.courseCode).filter(Boolean));
      for (const code of uniq) {
        outCourses.push({ code });
      }
    }
  }

  return { semesterId, courses: outCourses, classes: outClasses };
}

// --------- FALLBACK: parse STARS-Planner-like text ---------
const CLASS_LINE_RE =
  /\b([A-Z]{2,}\d{4})\s+(LEC\/STU|LEC|TUT|LAB|SEM)\s+([A-Z0-9+/-]+)\s+(.+?)\s+(\d{3,4})to(\d{3,4})-+\s+Wk([0-9,\-\s]+);?/g;

const TABLE_ROW_RE =
  /^\s*\d{3,}\s+([A-Z]{2,}\d{4})\s+(.+?)\s+\d+\s+Registered\s+(Not Applicable|(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{4})to(\d{4})\s+hrs)/m;

function hhmmToClock(hhmm: string): string {
  const s = hhmm.trim().padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

// --------- Parse the bottom "Index  Course  Title  ... @Exam Schedule" section ---------
const TABLE_GLOBAL_RE =
  /\b\d{3,}\s+([A-Z]{2,}\d{4})\s+(.+?)\s+\d+\s+Registered\s+(Not Applicable|(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{4})\s*to\s*(\d{4})\s*hrs)/g;

function extractCoursesAndExamsFromTable(text: string) {
  const out: Array<{ code: string; name?: string; exam?: ParsedCourseExam }> = [];
  for (const m of text.matchAll(TABLE_GLOBAL_RE)) {
    const code = m[1].trim();
    const title = m[2].trim().replace(/\s+/g, " ");
    const hasExam = m[3] !== "Not Applicable";
    const entry: any = { code, name: title };
    if (hasExam) {
      const day  = Number(m[4]);
      const monS = m[5];
      const yr   = Number(m[6]);
      const sH   = m[7];
      const eH   = m[8];
      const mon  = _month(monS);
      if (Number.isFinite(day) && mon >= 0 && Number.isFinite(yr)) {
        entry.exam = {
          dateStr: `${String(day)}-${monS}-${String(yr)}`,
          startHHMM: sH,
          endHHMM: eH,
          location: null,
        } as ParsedCourseExam;
      }
    }
    out.push(entry);
  }
  return out;
}

function mergeCourseMeta(
  base: { courses: ParsedCourse[]; classes: ParsedSemesterClass[] },
  meta: Array<{ code: string; name?: string; exam?: ParsedCourseExam }>
) {
  const byCode = new Map(base.courses.map(c => [c.code, c]));
  for (const row of meta) {
    const code = row.code.trim();
    if (!code) continue;
    const target = byCode.get(code);
    if (target) {
      // update missing fields
      if (!target.name && row.name) target.name = row.name;
      if (!target.exam && row.exam) target.exam = row.exam;
    } else {
      // add new course if not present
      base.courses.push({ code, name: row.name, exam: row.exam });
      byCode.set(code, base.courses[base.courses.length - 1]);
    }
  }
  return base;
}


function expandWeeks(spec: string): number[] {
  // "1-9,11,13" -> [1..9, 11, 13]
  const out = new Set<number>();
  for (const token of spec.replace(/\s+/g, "").split(",")) {
    if (!token) continue;
    const m = /^(\d+)-(\d+)$/.exec(token);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]);
      for (let w = Math.min(a, b); w <= Math.max(a, b); w++) out.add(w);
    } else {
      const n = Number(token);
      if (Number.isFinite(n)) out.add(n);
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}

function mapComponent(s: string): "LEC"|"TUT"|"LAB"|"SEM"|"OTHER" {
  const t = s.toUpperCase();
  if (t.includes("LEC")) return "LEC";
  if (t.includes("TUT")) return "TUT";
  if (t.includes("LAB")) return "LAB";
  if (t.includes("SEM")) return "SEM";
  return "OTHER";
}

function weeksKey(weeks: number[]): string {
  if (!Array.isArray(weeks) || weeks.length === 0) return "";
  return weeks.join(",");
}

function variantSuffix(delivery: string, location: string | null, weeks: number[]): string {
  const loc = (location ?? "").replace(/\s+/g, "_");
  const wk  = weeksKey(weeks).replace(/,/g, ".");
  // keep it readable; avoids hashing so it’s easy to inspect/debug
  return [delivery, loc, wk].filter(Boolean).join("_").slice(0, 64); // cap length
}



// --------- Anchor-based fallback: scan by 2-letter + 4-digit course codes ---------
const CODE_ANCHOR_RE = /\b([A-Z]{2}\d{4})\b/g;

// Accepts lines with or without the course code repeated.
// Examples matched (venue may have spaces):
//  - "SC2006 LEC/STU SCL2 LT19A 0830to0920- Wk1-9,11-13;"
//  - "LEC/STU SCL2 ONLINE 0830to0920- Wk10;"
//  - "TUT 7 LHN- TR+38 0930to1120- Wk3,5,7,9,11,13;"
const CLASS_VARIANT_RE =
  /(?:\b([A-Z]{2}\d{4})\s+)?(LEC\/STU|LEC|TUT|LAB|SEM)\s+([A-Z0-9+/-]+)\s+(.+?)\s+(\d{3,4})\s*to\s*(\d{3,4})\s*-+\s*Wk\s*([0-9,\-\s]+);?/g;

function parseClassesWithDays(lines: Line[], dayCols: DayCols) {
  const classes: ParsedSemesterClass[] = [];
  const courses: ParsedCourse[] = [];
  const seen = new Set<string>();

  for (const ln of lines) {
    const text = ln.text;
    for (const m of text.matchAll(CLASS_VARIANT_RE)) {
      const inlineCode = (m[1] ?? "").trim();
      const compRaw    = m[2];
      const groupIndex = m[3];
      const venueRaw   = m[4].trim().replace(/\s+/g, " ");
      const sHHMM      = m[5];
      const eHHMM      = m[6];
      const wkSpec     = m[7];

      if (!inlineCode) continue;
      if (!seen.has(inlineCode)) { courses.push({ code: inlineCode }); seen.add(inlineCode); }

      const component = mapComponent(compRaw);
      const startTime = hhmmToClock(sHHMM);
      const endTime   = hhmmToClock(eHHMM);
      const isOnline  = /(^|\s)ONLINE(\s|$)/i.test(venueRaw);
      const delivery  = isOnline ? "ONLINE" : "PHYSICAL";
      const location  = isOnline ? null : venueRaw;

      // Use the X at the *start index* of this regex match
      const matchStart = m.index ?? 0;
      const anchorX = xAt(ln, matchStart);
      const dayOfWeek = pickDayByX(anchorX, dayCols);

      classes.push({
        courseCode: inlineCode,
        component,
        groupIndex,
        dayOfWeek,
        startTime,
        endTime,
        location,
        delivery,
        weekSpec: { weeks: expandWeeks(wkSpec) },
      });
    }
  }
  return { courses, classes };
}



function parseByAnchors(text: string) {
  const courses: ParsedCourse[] = [];
  const classes: ParsedSemesterClass[] = [];
  const byCode = new Map<string, ParsedCourse>();

  // 1) Find all code anchors with their index
  const anchors: Array<{ code: string; idx: number }> = [];
  for (const m of text.matchAll(CODE_ANCHOR_RE)) {
    anchors.push({ code: m[1], idx: m.index ?? 0 });
  }
  if (anchors.length === 0) return { courses, classes };

  // 2) Slice blocks from each anchor to the next anchor
  for (let i = 0; i < anchors.length; i++) {
    const { code } = anchors[i];
    const start = anchors[i].idx;
    const end = i + 1 < anchors.length ? anchors[i + 1].idx : text.length;
    const block = text.slice(start, end);

    // ensure course exists
    if (!byCode.has(code)) {
      const c: ParsedCourse = { code };
      byCode.set(code, c);
      courses.push(c);
    }

    // 3) Within the block, extract all class variants (code optional in line)
    for (const m of block.matchAll(CLASS_VARIANT_RE)) {
      const inlineCode = (m[1] ?? code).trim();
      const compRaw = m[2];
      const groupIndex = m[3];
      const venue = m[4].trim().replace(/\s+/g, " ");
      const sHHMM = m[5];
      const eHHMM = m[6];
      const wkSpec = m[7];

      const component = mapComponent(compRaw);
      const startTime = hhmmToClock(sHHMM);
      const endTime   = hhmmToClock(eHHMM);

      // ONLINE if venue equals or contains "ONLINE"
      const isOnline = /(^|\s)ONLINE(\s|$)/i.test(venue);
      const delivery = isOnline ? "ONLINE" : "PHYSICAL";
      const location = isOnline ? null : venue;

      classes.push({
        courseCode: inlineCode,
        component,
        groupIndex,
        dayOfWeek: 1, // plain text grid doesn't guarantee column→weekday; keep 1 as safe fallback
        startTime,
        endTime,
        location,
        delivery,
        weekSpec: { weeks: expandWeeks(wkSpec) },
      });
    }
  }

  return { courses, classes };
}

function toMin(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function timeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = toMin(aStart), aE = toMin(aEnd);
  const bS = toMin(bStart), bE = toMin(bEnd);
  return !(aE <= bS || bE <= aS);
}

// FNV-ish fast stable hash → 1..6
function daySeed(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 6) + 1; // 1..6 (Mon..Sat)
}

// Tutorials stick to same day per course + group; others stick by component too
function groupKeyForDayStickiness(c: ParsedSemesterClass): string {
  const comp = (c.component ?? "OTHER").toUpperCase();
  const group = (c.groupIndex ?? "1").toString();
  const code = (c.courseCode ?? "").trim();
  if (comp.includes("TUT")) return `${code}::TUT::${group}`;
  return `${code}::${comp}::${group}`;
}

/** Randomize (stable) weekdays with no clashes across Mon..Sat (1..6). */
function assignWeekdaysNoClash(classes: ParsedSemesterClass[]): ParsedSemesterClass[] {
  const out = classes.map(c => ({ ...c }));

  const groupDesired = new Map<string, number>();
  for (const c of out) {
    const gk = groupKeyForDayStickiness(c);
    if (!groupDesired.has(gk)) groupDesired.set(gk, daySeed(gk));
  }

  type Placed = { start: string; end: string };
  const placed: Record<number, Placed[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  out.sort((a, b) => toMin((a.startTime ?? "08:30")) - toMin((b.startTime ?? "08:30")));

  for (const c of out) {
    const start = c.startTime ?? "08:30";
    const end   = c.endTime   ?? "09:20";
    const desired = groupDesired.get(groupKeyForDayStickiness(c)) ?? 1;

    let assignedDay = desired;
    let attempts = 0;

    while (attempts < 6) {
      const conflicts = placed[assignedDay].some(p => timeOverlap(start, end, p.start, p.end));
      if (!conflicts) {
        placed[assignedDay].push({ start, end });
        c.dayOfWeek = assignedDay;
        break;
      }
      assignedDay = (assignedDay % 6) + 1;
      attempts++;
    }

    if (!c.dayOfWeek) {
      c.dayOfWeek = desired || 1;
      placed[c.dayOfWeek].push({ start, end });
    }
  }

  return out;
}


export class SemesterCalendarService {
  private tempDir = "tmp/semester_Calendar/uploads";
  private debugDir = "tmp/semester_Calendar/debug";

  private async resolveSemesterId(semesterKey?: string): Promise<string> {
    if (!semesterKey) throw new Error(`Semester not found: missing id/name`);

    // direct id or name
    const byDirect = await prisma.semester.findFirst({
      where: { OR: [{ id: semesterKey }, { name: semesterKey }] },
      select: { id: true },
    });
    if (byDirect) return byDirect.id;

    // short key AY25S1
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
      `Semester not found for key "${semesterKey}". Pass a valid Semester.id, Semester.name (e.g. "AY25/26 Sem 1"), or short "AY25S1".`
    );
  }

 

  // ---------- Upsert parsed data into Course / CourseClass / CourseExam ----------
  private async upsertParsedIntoSchema(studentId: string, semesterId: string, parsedNorm: ReturnType<typeof normalizeParsed>) {
    const codeToCourseId = new Map<string, string>();

    // 1) Courses (+ exams)
    for (const c of parsedNorm.courses) {
  const code = c.code.trim();
  if (!code) continue;
  const desiredName = (c.name ?? code).trim();

  // find by code first
  let course = await prisma.course.findFirst({
    where: { code },
    select: { id: true, name: true },
  });

  if (!course) {
    course = await prisma.course.create({
      data: { code, name: desiredName },
      select: { id: true, name: true },
    });
  } else if (course.name !== desiredName && desiredName && desiredName !== code) {
    await prisma.course.update({
      where: { id: course.id },
      data: { name: desiredName },
    });
  }

  codeToCourseId.set(code, course.id);

  // exams (unchanged)
  if (c.exam) {
    const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(c.exam.dateStr);
    if (m) {
      const day = Number(m[1]);
      const mon = _month(m[2]);
      const year = Number(m[3]);
      if (mon >= 0) {
        const startHH = Number(c.exam.startHHMM.slice(0, 2));
        const startMM = Number(c.exam.startHHMM.slice(2));
        const endHH = Number(c.exam.endHHMM.slice(0, 2));
        const endMM = Number(c.exam.endHHMM.slice(2));

        const startsAt = new Date(Date.UTC(year, mon, day, startHH, startMM, 0, 0));
        const endsAt   = new Date(Date.UTC(year, mon, day, endHH, endMM, 0, 0));

        await prisma.courseExam.upsert({
          where: { courseId_semesterId_startsAt: { courseId: course.id, semesterId, startsAt } },
          update: { endsAt, location: c.exam.location ?? null },
          create: { courseId: course.id, semesterId, startsAt, endsAt, location: c.exam.location ?? null },
        });
      }
    }
  }
}


   // 2) Classes
    for (const cl of parsedNorm.classes) {
      const courseCode = (cl.courseCode ?? "").trim();
      if (!courseCode) continue;

      const ensuredCourseId =
        codeToCourseId.get(courseCode) ??
        (await prisma.course.upsert({
          where: { code_name: { code: courseCode, name: courseCode } },
          update: {},
          create: { code: courseCode, name: courseCode },
          select: { id: true },
        })).id;

      const weeks = Array.isArray(cl?.weekSpec?.weeks) ? cl.weekSpec.weeks : [];
      const weeksJson = JSON.stringify(weeks);

      const component = (cl.component ?? "OTHER").toString().toUpperCase() as any; // Prisma enum
      const delivery  = (cl.delivery ?? "PHYSICAL").toString().toUpperCase() as any; // Prisma enum

      const dayOfWeek = Number(cl.dayOfWeek ?? 1);
      const startTime = cl.startTime ?? "08:30";
      const endTime   = cl.endTime ?? "09:20";

      // === NEW: human-readable index ===
      // SC2006_LEC or SC2006_LEC_ONLINE
      const baseIndex = `${courseCode}_${component}${delivery === "ONLINE" ? "_ONLINE" : ""}`;

      // First try the natural unique key.
      const uniqueWhere = {
        semesterId_index_component_dayOfWeek_startTime_endTime: {
          semesterId,
          index: baseIndex,
          component,
          dayOfWeek,
          startTime,
          endTime,
        },
      };

      const existing = await prisma.courseClass.findUnique({ where: uniqueWhere });

      if (!existing) {
        await prisma.courseClass.create({
          data: {
            courseId: ensuredCourseId,
            semesterId,
            index: baseIndex,
            component,
            dayOfWeek,
            startTime,
            endTime,
            weeksJson,
            location: cl.location || null,
            delivery,
          },
        });
      } else {
        // Collision at same slot. If it's the same variant, update; else, namespace the index.
        const sameVariant =
          (existing.location ?? null) === (cl.location ?? null) &&
          (existing.delivery ?? "PHYSICAL") === delivery &&
          existing.weeksJson === weeksJson;

        if (sameVariant) {
          await prisma.courseClass.update({
            where: uniqueWhere,
            data: {
              courseId: ensuredCourseId,
              location: cl.location || null,
              delivery,
              weeksJson,
            },
          });
        } else {
          // Different variant (e.g., ONLINE vs PHYSICAL/venue/weeks) → create another row
          const suffix = variantSuffix(delivery, cl.location || null, weeks); // e.g., "PHYSICAL_LT19A_1.3.5.7"
          const namespacedIndex = `${baseIndex}#${suffix}`;

          await prisma.courseClass.upsert({
            where: {
              semesterId_index_component_dayOfWeek_startTime_endTime: {
                semesterId,
                index: namespacedIndex,
                component,
                dayOfWeek,
                startTime,
                endTime,
              },
            },
            update: {
              courseId: ensuredCourseId,
              location: cl.location || null,
              weeksJson,
              delivery,
            },
            create: {
              courseId: ensuredCourseId,
              semesterId,
              index: namespacedIndex,
              component,
              dayOfWeek,
              startTime,
              endTime,
              weeksJson,
              location: cl.location || null,
              delivery,
            },
          });
        }
      }
    }

    // 3) Enrollments
    const codes = Array.from(
  new Set(
    parsedNorm.classes.map(x => (x.courseCode ?? "").trim()).filter(Boolean)
  )
);

if (codes.length > 0) {
  const classes = await prisma.courseClass.findMany({
    where: { semesterId, course: { code: { in: codes } } },
    select: { id: true, courseId: true },
  });

  for (const c of classes) {
    await prisma.timetableEnrollment.upsert({
      where: { studentId_classId: { studentId, classId: c.id } },
      update: {},
      create: { studentId, classId: c.id, courseId: c.courseId },
    });
  }
}
  }

  // ---------- Main entry ----------
  async uploadAndParse(opts: {
    semesterKey?: string;
    academicYear?: string;
    defaultYear?: number;
    altYear?: number;
    studentId: string;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
  }) {
    const {
      semesterKey,
      academicYear,
      defaultYear,
      altYear,
      studentId,
      originalFilename,
      mimeType,
      buffer,
    } = opts;

    // persist bytes
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.debugDir, { recursive: true }).catch(() => {});
    const safeName = originalFilename.replace(/[^\w.\-() ]+/g, "_");
    const tmpPath = path.join(this.tempDir, `stt_${Date.now()}_${safeName}`);
    await fs.writeFile(tmpPath, buffer);

    // resolve semester
    if (!semesterKey) {
      throw new Error(`Semester not found: please provide semesterKey (cuid / "AY25/26 Sem 1" / "AY25S1")`);
    }
    const semesterId = await this.resolveSemesterId(semesterKey);

    // years (reserved for CSV/ICS)
    const short = ayShortFrom(academicYear) || null;
    const def = defaultYear ?? (short ? 2000 + parseInt(short.split("/")[0], 10) : undefined);
    const alt = altYear ?? (def ? def + 1 : undefined);

    // parse
    let textFromPdf: string | undefined;
    let parsedRaw: ParsedSemester | null = null;

    let dayAware: { courses: ParsedCourse[]; classes: ParsedSemesterClass[] } | null = null;
    try {
      const { tokens } = await extractTextWithLayout(buffer);
      const lines = buildLines(tokens);
      let dayCols = detectDayColumns(lines);
      // NEW fallback on tokens if line-based detection failed
      if (!dayCols) dayCols = detectDayColumnsFromTokens(tokens);

      if (dayCols) {
        dayAware = parseClassesWithDays(lines, dayCols);
      }


    } catch { /* ignore layout failures */ }
     


    if (/pdf/i.test(mimeType) || /\.pdf$/i.test(originalFilename)) {
      const { text } = await extractTextFromPdfBytes(buffer);
      textFromPdf = text;



      if (parseSemesterTimetableFn) {
        parsedRaw = await parseSemesterTimetableFn({ kind: "pdf-text", text, semesterId, defaultYear: def, altYear: alt });
      } else if (parseSemesterTimetableTextFn) {
        parsedRaw = await parseSemesterTimetableTextFn({ semesterId, text, defaultDayOfWeek: 1 });
      } else {
        throw new Error(`No available parser in semester_Parser (expect parseSemesterTimetable or parseSemesterTimetableText).`);
      }

      await fs.writeFile(path.join(this.debugDir, `semester_${Date.now()}.txt`), textFromPdf).catch(() => {});
    } else if (/text\/calendar|\.ics$/i.test(mimeType) || /\.ics$/i.test(originalFilename)) {
      if (!parseSemesterTimetableFn) {
        throw new Error(`ICS parsing unavailable: export parseSemesterTimetable from semester_Parser.`);
      }
      parsedRaw = await parseSemesterTimetableFn({ kind: "ics", buffer, defaultYear: def, altYear: alt });
      parsedRaw.semesterId = semesterId;
    } else if (/csv|text\/plain/i.test(mimeType) || /\.csv$/i.test(originalFilename)) {
      if (!parseSemesterTimetableFn) {
        throw new Error(`CSV parsing unavailable: export parseSemesterTimetable from semester_Parser.`);
      }
      parsedRaw = await parseSemesterTimetableFn({ kind: "csv", buffer, defaultYear: def, altYear: alt });
      parsedRaw.semesterId = semesterId;
    } else {
      throw new Error(`Unsupported file type "${mimeType}". Please upload PDF, ICS, or CSV.`);
    }

    // normalize shape
    let parsed = normalizeParsed(parsedRaw ?? undefined, semesterId);

    // If we successfully detected weekday columns, use those classes
    if (dayAware && dayAware.classes.length > 0) {
      // merge courses (avoid dups)
      const have = new Set(parsed.courses.map(c => c.code));
      for (const c of dayAware.courses) if (!have.has(c.code)) parsed.courses.push(c);
      // take day-aware classes (they carry proper dayOfWeek)
      parsed.classes = dayAware.classes;
    }

        // If still no classes, force a text fallback on the raw PDF text
    if (parsed.classes.length === 0 && textFromPdf && textFromPdf.trim()) {
      const fb = parseByAnchors(textFromPdf);
      if (fb.classes.length) {
        const have2 = new Set(parsed.courses.map(c => c.code));
        for (const c of fb.courses) if (!have2.has(c.code)) parsed.courses.push(c);
        parsed.classes = fb.classes;
      }
    }

        // Randomize weekdays only if needed (all Monday or any missing)
    if (parsed.classes.length > 0) {
      const allOne = parsed.classes.every(c => (c.dayOfWeek ?? 1) === 1);
      const anyMissing = parsed.classes.some(c => !c.dayOfWeek);
      if (allOne || anyMissing) {
        parsed.classes = assignWeekdaysNoClash(parsed.classes);
      }
    }




    // still augment names + exams from the bottom table if available (keeps classes as-is)
    if (textFromPdf && textFromPdf.includes("Index") && textFromPdf.includes("Course") && textFromPdf.includes("Title")) {
      const meta = extractCoursesAndExamsFromTable(textFromPdf);
      if (meta.length) parsed = mergeCourseMeta(parsed, meta);
    }

    // store file record
    const fileRec = await prisma.semesterCalendarFile.create({
      data: {
        semesterId,
        studentId,
        filePath: tmpPath,
        fileName: originalFilename,
        mimeType,
        sizeBytes: buffer.length,
        content: buffer,
        textContent: textFromPdf ?? null,
        extractedJson: { ...parsedRaw, semesterId, normalized: parsed }, // keep both raw + normalized
      },
      select: { id: true },
    });

    // upsert into schema
    await this.upsertParsedIntoSchema(studentId, semesterId, parsed);

    // materialize (signature: studentId, semesterId)
    await materializeTimetable({studentId, semesterId});

    return {
      fileId: fileRec.id,
      semesterId,
      parsedSummary: {
        classes: parsed.classes.length,
        courses: parsed.courses.length,
      },
      materialized: { ok: true },
    };
  }
}
