export type NudgeType = "study-streak" | "hydration" | "outdoor" | "schedule-reminder";

export type NudgeStatus = "pending" | "sent" | "dismissed" | "accepted";

export type Nudge = {
  id: string;
  studentId: string;
  type: NudgeType;
  rationale: string;
  status: NudgeStatus;
  createdAt: Date;
  sentAt?: Date | null;
  readAt?: Date | null;
};

export type NudgeAction = {
  id: string;
  nudgeId: string;
  studentId: string;
  action: "accept" | "dismiss";
  createdAt: Date;
};
