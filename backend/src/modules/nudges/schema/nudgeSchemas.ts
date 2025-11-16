// src/modules/Nudges/schema/nudgeSchemas.ts
import { z } from "zod";

export const NudgeResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  type: z.string(),
  rationale: z.string(),
  status: z.string(),
  createdAt: z.string(),
  sentAt: z.string().nullable().optional(),
  readAt: z.string().nullable().optional(),
});

export const AcceptDismissBody = z.object({
  // optionally allow metadata
  metadata: z.record(z.any()).optional(),
});
