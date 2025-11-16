import { NudgeCandidate } from "../types";

export async function generateCandidates(userId: string): Promise<NudgeCandidate[]> {
  // For now: stub with fixed candidates
  return [
    { type: "study-streak" },
    { type: "hydration" },
    { type: "outdoor" }
  ];
}
