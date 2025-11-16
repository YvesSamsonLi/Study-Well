// /src/app/server.ts
import "dotenv/config";
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import swaggerPlugin from "./plugins/swagger";
import corsPlugin from "./plugins/cors";
import jwtPlugin from "./plugins/jwt";
import multipartPlugin from "./plugins/multipart";
import requestIdPlugin from "./plugins/requestid";
import rateLimitPlugin from "./plugins/rateLimit";
import helmetPlugin from "./plugins/helmet";

import registerRoutes from "./routes";
import { env } from "../core/config/env";
import { prisma, closePrisma } from "../core/db/prisma";

// Zod provider + compilers
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";

// if you implemented the lazy/no-op redis helper:
const getRedis = async () => (await import("../core/cache/redis.ts")).getRedis?.();

const JOBS_ENABLED = String(process.env.JOBS_ENABLED).toLowerCase() === "true";

async function bootstrap() {
  const app: FastifyInstance = Fastify({
    trustProxy: true,
    bodyLimit: 1 * 1024 * 1024,
    requestTimeout: 30_000,
    pluginTimeout: 60_000,
    logger:
      process.env.NODE_ENV === "production"
        ? { level: "info" }
        : {
            level: "debug",
            transport: {
              target: "pino-pretty",
              options: { singleLine: true, translateTime: "SYS:standard" },
            },
          },
  });

  // ----- Zod globally -----
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  // make Zod the default type provider for the app (routes can still override)
  (app as any).withTypeProvider?.<ZodTypeProvider>();

  // ----- Core plugins -----
  await app.register(requestIdPlugin);
  await app.register(rateLimitPlugin); // RATE_LIMIT_STORE=memory
  await app.register(corsPlugin);
  await app.register(jwtPlugin);
  await app.register(multipartPlugin);
  await app.register(swaggerPlugin);
  await app.register(helmetPlugin);

  // ----- Liveness -----
  app.get("/health", async (_req: FastifyRequest, _reply: FastifyReply) => ({
    status: "ok",
    service: "studywell-api",
    time: new Date().toISOString(),
  }));

  // ----- Readiness (DB required; Redis only if jobs enabled) -----
  app.get("/ready", async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (JOBS_ENABLED && getRedis) {
        const redis = await getRedis();
        if (redis) await redis.ping();
      }
      reply.send({ status: "ready", jobs: JOBS_ENABLED ? "on" : "off" });
    } catch (err) {
      app.log.error({ err }, "readiness check failed");
      reply.code(503).send({ status: "not-ready" });
    }
  });

  // ----- Global error handler -----
  app.setErrorHandler((err: unknown, req, reply) => {
    const status = (err as any)?.statusCode ?? 500;
    req.log.error({ err }, "unhandled error");
    reply.code(status).type("application/problem+json").send({
      type: "about:blank",
      title: status === 500 ? "Internal Server Error" : (err as any)?.message,
      status,
    });
  });

  // ----- Versioned routes (routes.ts mounts /v1 internally) -----
  await app.register(registerRoutes);

  // ----- Start -----
  const port = Number(process.env.PORT ?? env.PORT ?? 3000);
  const host = "0.0.0.0";
  try {
    await app.listen({ port, host });
    app.log.info(`StudyWell API listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // ----- Graceful shutdown -----
  const shutdown = async (sig: NodeJS.Signals) => {
    try {
      app.log.info({ sig }, "shutting down");
      await app.close();
      if (JOBS_ENABLED) {
        const { closeQueues } = await import("../jobs/queues");
        await closeQueues();
        if (getRedis) {
          const redis = await getRedis();
          if (redis) await redis.quit();
        }
      }
      await closePrisma();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap();
