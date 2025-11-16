import { Nudge } from "../types";

export class NudgeRepo {
  async save(nudge: Nudge): Promise<void> {
    // TODO: persist to DB
    console.log("Saved nudge", nudge);
  }

  async listByUser(userId: string): Promise<Nudge[]> {
    // TODO: fetch from DB
    return [];
  }
}
