import { newWorker } from "../core/cache/redis";
import type { ReminderJobPayload } from "./queues";

newWorker<ReminderJobPayload>("reminders", async (job) => {
  const p = job.data;
  // TODO: push notif/email/SMS; ensure idempotent send
  console.log("[reminder] send", p.studentId, p.title, p.atISO);
}, { concurrency: 10 }).on("failed", (job, err) => {
  console.error("[reminder] failed", job?.id, err);
});
