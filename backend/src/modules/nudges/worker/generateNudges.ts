import { Queue, Worker } from "bullmq";
import { runNudgePipeline } from "../pipeline";
import { NudgeRepo } from "../repos/NudgeRepo";

const queueName = "generate-nudges";
export const nudgeQueue = new Queue(queueName);

const repo = new NudgeRepo();

export const nudgeWorker = new Worker(queueName, async job => {
  const { userId } = job.data;
  const nudges = await runNudgePipeline(userId);
  for (const n of nudges) {
    await repo.save(n);
  }
});

// Schedule job example
export async function scheduleNudgeJob(userId: string) {
  await nudgeQueue.add("generate-for-user", { userId }, { repeat: { every: 3600000 } }); // every 1h
}
