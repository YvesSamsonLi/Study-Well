// src/app/plugins/rateLimit.ts
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";

const useMemory = String(process.env.RATE_LIMIT_STORE).toLowerCase() === "memory";

export default fp(async (app) => {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    // Only wire Redis when NOT memory
    ...(useMemory ? {} : { redis: { host: "127.0.0.1", port: 6379 } }),
  });
});
