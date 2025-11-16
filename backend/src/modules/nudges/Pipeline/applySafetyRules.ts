import { NudgeCandidate } from "../types";

export async function applySafetyRules(
  userId: string,
  candidates: NudgeCandidate[]
): Promise<NudgeCandidate[]> {
  // Example: filter out "outdoor" if bad weather/crowded
  return candidates.filter(c => c.type !== "outdoor"); // stub
}
