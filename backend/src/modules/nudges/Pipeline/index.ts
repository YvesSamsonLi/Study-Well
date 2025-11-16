import { computeStudyStreak } from "./computeStudyStreak";
import { generateCandidates } from "./generateCandidates";
import { applySafetyRules } from "./applySafetyRules";
import { attachRationales } from "./attachRationales";
import { Nudge } from "../types";

export async function runNudgePipeline(userId: string): Promise<Nudge[]> {
  const streak = await computeStudyStreak(userId);

  let candidates = await generateCandidates(userId);
  if (streak >= 3) {
    candidates.push({ type: "study-streak", data: { streak } });
  }

  candidates = await applySafetyRules(userId, candidates);
  const nudges = await attachRationales(userId, candidates);

  return nudges;
}
