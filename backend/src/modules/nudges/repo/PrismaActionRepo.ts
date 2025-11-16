// src/modules/Nudges/repos/PrismaActionRepo.ts
import { PrismaClient } from "@prisma/client";
import { NudgeAction } from "../types";

const prisma = new PrismaClient();

export class PrismaActionRepo {
  async create(a: { nudgeId: string; studentId: string; action: "accept" | "dismiss" }) {
    const row = await prisma.nudgeAction.create({
      data: {
        nudgeId: a.nudgeId,
        studentId: a.studentId,
        action: a.action,
      }
    });
    return {
      id: row.id,
      nudgeId: row.nudgeId,
      studentId: row.studentId,
      action: row.action as any,
      createdAt: row.createdAt,
    } as NudgeAction;
  }

  async listByStudent(studentId: string) {
    return prisma.nudgeAction.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
  }
}
