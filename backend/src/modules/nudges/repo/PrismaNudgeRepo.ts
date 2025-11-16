// src/modules/Nudges/repos/PrismaNudgeRepo.ts
import { PrismaClient } from "@prisma/client";
import { Nudge } from "../types";

const prisma = new PrismaClient();

export class PrismaNudgeRepo {
  async create(n: Omit<Nudge, "id" | "createdAt">): Promise<Nudge> {
    const created = await prisma.nudge.create({
      data: {
        studentId: n.studentId,
        type: n.type,
        rationale: n.rationale,
        status: n.status ?? "pending",
        sentAt: n.sentAt ?? null,
        readAt: n.readAt ?? null,
      }
    });
    return {
      id: created.id,
      studentId: created.studentId,
      type: created.type as any,
      rationale: created.rationale,
      status: created.status as any,
      createdAt: created.createdAt,
      sentAt: created.sentAt ?? undefined,
      readAt: created.readAt ?? undefined,
    };
  }

  async listByStudent(studentId: string, limit = 50): Promise<Nudge[]> {
    const rows = await prisma.nudge.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(r => ({
      id: r.id,
      studentId: r.studentId,
      type: r.type as any,
      rationale: r.rationale,
      status: r.status as any,
      createdAt: r.createdAt,
      sentAt: r.sentAt ?? undefined,
      readAt: r.readAt ?? undefined,
    }));
  }

  async markSent(id: string): Promise<void> {
    await prisma.nudge.update({ where: { id }, data: { status: "sent", sentAt: new Date() } });
  }

  async updateStatus(id: string, status: "dismissed" | "accepted"): Promise<void> {
    const data: any = { status };
    if (status === "dismissed" || status === "accepted") {
      data.readAt = new Date();
    }
    await prisma.nudge.update({ where: { id }, data });
  }
}
