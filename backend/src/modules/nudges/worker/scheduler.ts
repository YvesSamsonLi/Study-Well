import { Queue } from "bullmq";
import { runNudgePipeline } from "../Pipeline";
import { PrismaNudgeRepo } from "../Repo/PrismaNudgeRepo";

const nudgeQueue = new Queue("nudgeQueue");

nudgeQueue.add(
  "generateNudges",
  {},
  { repeat: { cron: "0 * * * *" } } // hourly
);

nudgeQueue.process("generateNudges", async () => {
  const repo = new PrismaNudgeRepo();
  // Replace with actual student query
  const userIds = ["student1", "student2"];
  for (const userId of userIds) {
    const nudges = await runNudgePipeline(userId);
    for (const nudge of nudges) await repo.create(nudge);
  }
});
