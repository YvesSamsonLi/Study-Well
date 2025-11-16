import fs from "fs";
import pdf from "pdf-parse";

interface CourseClass {
  type: string;
  day: string;
  time: string;
  venue: string;
  weeks: string;
}

interface ExamInfo {
  date?: string;
  time?: string;
}

interface Course {
  code: string;
  title: string;
  au: number;
  status: string;
  exam: ExamInfo;
  classes: CourseClass[];
}

async function parsePlannerPdf(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  const text = data.text.replace(/\s+/g, " ").trim();

  // Example: extract registered courses
  const courseRegex = /(SC\d{4}|CC\d{4})\s+([\w\s&]+?)\s+3\s+Core.*?(Registered).*?(?:\d{2}-Nov-\d{4}\s+\d{4}to\d{4}\s+hrs|Not Applicable)/g;
  const courses: Course[] = [];

  let match;
  while ((match = courseRegex.exec(text)) !== null) {
    courses.push({
      code: match[1],
      title: match[2].trim(),
      au: 3,
      status: match[3],
      exam: { date: match[4]?.includes("Not") ? undefined : match[4] },
      classes: [] // TODO: parse from timetable
    });
  }

  return { courses };
}

(async () => {
  const result = await parsePlannerPdf("Planner.pdf");
  console.log(JSON.stringify(result, null, 2));
})();