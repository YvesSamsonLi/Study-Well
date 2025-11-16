import { describe, it, expect } from "vitest";
import { renderIcs } from "../../../src/modules/interop/ics/svc.renderIcs";
import fs from "fs";

describe("ICS rendering", () => {
  it("matches golden snapshot", () => {
    const ics = renderIcs("StudyWell", [
      { id: "evt1", title: "Lecture", startAt: new Date("2025-10-01T02:00:00Z"), endAt: new Date("2025-10-01T03:00:00Z") },
    ]);
    const golden = fs.readFileSync("tests/golden/ics/expected.ics", "utf8");
    expect(ics).toBe(golden);
  });
});
