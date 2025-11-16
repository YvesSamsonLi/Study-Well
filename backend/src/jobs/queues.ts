// src/jobs/queues.ts
import type { Queue } from "bullmq";
const JOBS_ENABLED = String(process.env.JOBS_ENABLED).toLowerCase() === "true";

let makeQueue: ((name: string) => Queue) | null = null;

function buildNoopQueue(name: string): Queue {
  // minimal facade; implement only what your code calls
  // @ts-expect-error partial
  return {
    name,
    add: async () => ({ id: "noop" }),
    addBulk: async () => [],
    close: async () => undefined,
  };
}

export async function getQueue(name: string): Promise<Queue> {
  if (!JOBS_ENABLED) return buildNoopQueue(name);

  if (!makeQueue) {
    const { Queue } = await import("bullmq");
    const connection = { connection: { url: process.env.REDIS_URL! } };
    makeQueue = (n: string) => new Queue(n, connection);
  }
  return makeQueue(name);
}

export async function closeQueues() {
  if (!JOBS_ENABLED || !makeQueue) return;
  // If you track created queues, close them here; otherwise noop is fine.
}
