import { NudgeCandidate, Nudge } from "../types";
import { randomUUID } from "crypto";

export async function attachRationales(
  userId: string,
  candidates: NudgeCandidate[]
): Promise<Nudge[]> {
  const now = new Date();
  return candidates.map(c => ({
    id: randomUUID(),
    userId,
    type: c.type,
    rationale: `You got this nudge because of ${c.type}.`,
    createdAt: now
  }));
}
