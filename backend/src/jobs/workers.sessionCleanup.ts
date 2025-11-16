import { newWorker } from "../core/cache/redis";
import { prisma } from "../core/db/prisma";

export const sessionCleanupWorker = newWorker("sessionCleanup", async () => {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
});
