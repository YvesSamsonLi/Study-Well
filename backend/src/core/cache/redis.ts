// src/core/cache/redis.ts
import { createClient, type RedisClientType } from "redis";

const JOBS_ENABLED = String(process.env.JOBS_ENABLED).toLowerCase() === "true";

let client: RedisClientType | null = null;

function buildNoop(): RedisClientType {
  // @ts-expect-error – minimal stub to satisfy callers
  return {
    ping: async () => "PONG",
    quit: async () => undefined,
    on: () => {},
  };
}

export async function getRedis(): Promise<RedisClientType> {
  if (!JOBS_ENABLED) return buildNoop();

  if (!client) {
    const url = process.env.REDIS_URL!;
    client = createClient({ url });
    client.on("error", (err) => {
      // Don’t spam logs; single concise line
      console.error("[redis] error", err?.message ?? err);
    });
    await client.connect();
  }
  return client;
}
