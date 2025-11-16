import { SemesterTimetableJSON } from "../schema/semester_Timetable";

const normalizeTime = (s: string) =>
  s.includes(":") ? s : `${s.slice(0,2)}:${s.slice(2)}`; // "0830" -> "08:30"

/**
 * Very lightweight parser for patterns like:
 *   SC2006 LEC/STU SCL2 ONLINE
 *   0830to0920-
 *   Wk1-9,11-13;
 * 
 * Assumptions:
 * - Each class block has 2~3 lines (header / time / weekSpec)
 * - Day-of-week is NOT printed → caller must inject dayOfWeek via context
 *   (If your PDFs list "Mon", "Tue", etc., add a pre-pass to detect it.)
 */
export function parseSemesterTimetableText(opts: {
  semesterId: string;
  text: string;
  defaultDayOfWeek?: number; // fallback when day is not discoverable (1=Mon)
}): Omit<SemesterTimetableJSON, "classes"> & { classes: SemesterTimetableJSON["classes"] } {
  const { semesterId, text, defaultDayOfWeek = 1 } = opts;

  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  type Pending = {
    courseCode: string;
    component:  "LEC"|"TUT"|"LAB"|"SEM"|"OTHER";
    groupIndex: string;
    location:   string;
  } | null;

  const classes: SemesterTimetableJSON["classes"] = [];
  let pending: Pending = null;

  const hdrRe = /^([A-Z]{2,}\d{4,})\s+([A-Z]{3})\/?[A-Z]*\s+(\S+)\s+(\S+)$/; // SC2006 LEC/STU SCL2 LT19A|ONLINE
  const timeRe = /^(\d{3,4}|\d{2}:\d{2})\s*(?:to|-)\s*(\d{3,4}|\d{2}:\d{2})/i; // 0830to0920- or 08:30-09:20
  const weekRe = /^(?:Wk|Week)\s*([0-9,\-\s]+);?$/i;                           // Wk1-9,11-13;

  let lastTime: { start: string; end: string } | null = null;

  for (const ln of lines) {
    const hdr = hdrRe.exec(ln);
    if (hdr) {
      const [, code, comp, idx, loc] = hdr;
      const component = (["LEC","TUT","LAB","SEM"].includes(comp) ? comp : "OTHER") as Pending["component"];
      pending = { courseCode: code, component, groupIndex: idx, location: loc };
      lastTime = null;
      continue;
    }

    const tt = timeRe.exec(ln);
    if (tt) {
      lastTime = { start: normalizeTime(tt[1]), end: normalizeTime(tt[2]) };
      continue;
    }

    const wk = weekRe.exec(ln);
    if (wk && pending && lastTime) {
      const raw = wk[1].replace(/\s+/g, "");
      const weekNums = expandWeeks(raw); // e.g. "1-9,11-13" -> [1..9,11,12,13]
      const delivery = pending.location.toUpperCase() === "ONLINE" ? "ONLINE" : "PHYSICAL";

      classes.push({
        courseCode: pending.courseCode,
        component: pending.component,
        groupIndex: pending.groupIndex,
        location: pending.location,
        dayOfWeek: defaultDayOfWeek,     // you can enhance later if PDF provides day names
        startTime: lastTime.start,
        endTime: lastTime.end,
        weekSpec: { raw: `Wk${raw}`, weeks: weekNums },
        delivery,
      });

      // reset time; keep pending (some PDFs list multiple week lines under same header)
      lastTime = null;
      continue;
    }
  }

  return { semesterId, classes };
}

function expandWeeks(raw: string): number[] {
  // "1-3,5,7-9" → [1,2,3,5,7,8,9]
  const parts = raw.split(",");
  const out: number[] = [];
  for (const p of parts) {
    const m = /^(\d+)-(\d+)$/.exec(p);
    if (m) {
      const a = Number(m[1]); const b = Number(m[2]);
      for (let x = Math.min(a,b); x <= Math.max(a,b); x++) out.push(x);
    } else if (/^\d+$/.test(p)) {
      out.push(Number(p));
    }
  }
  return Array.from(new Set(out)).sort((a,b)=>a-b);
}
