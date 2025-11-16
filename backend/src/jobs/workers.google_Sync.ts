import { newWorker } from "../core/cache/redis";

newWorker("googleSync", async (job) => {
  const p = job.data as { studentId: string; mode: string; eventId?: string };
  console.log("[googleSync]", p.mode, "for", p.studentId, p.eventId ?? "");
});
