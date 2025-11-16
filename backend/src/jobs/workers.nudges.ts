import { newWorker } from "../core/cache/redis";

newWorker("nudges", async (job) => {
  const p = job.data as { studentId: string };
  console.log("[nudges] generate for", p.studentId);
});
