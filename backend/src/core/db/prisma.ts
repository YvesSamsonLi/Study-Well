import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client.
 * - In dev: logs queries/warns/errors.
 * - In prod/test: logs only errors.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

/** Graceful shutdown (call in Fastify onClose hook) */
export async function closePrisma() {
  await prisma.$disconnect();
}
