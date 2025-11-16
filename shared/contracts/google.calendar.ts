// shared/contracts/google.calendar.ts
import { z } from "zod";

// --- Request Schemas ---
export const GoogleAuthQuery = z.object({
  studentId: z.string().min(1),
});

export const GoogleSyncBody = z.object({
  studentId: z.string().min(1),
});

export const GooglePurgeBody = z.object({
  studentId: z.string().min(1),
});

export const GoogleUnlinkBody = z.object({
  studentId: z.string().min(1),
});

export const GoogleStatusQuery = z.object({
  studentId: z.string().min(1),
});

// --- Response Schemas ---
export const GoogleSyncResponse = z.object({
  ok: z.boolean(),
  created: z.number().optional(),
  googleIds: z.array(z.string()).optional(),
});

export const GooglePurgeResponse = z.object({
  ok: z.boolean(),
  totalFound: z.number().optional(),
  deletedFromGoogle: z.number().optional(),
  resetDb: z.boolean().optional(),
});

export const GoogleStatusResponse = z.object({
  ok: z.boolean(),
  linked: z.boolean(),
  hasRefresh: z.boolean(),
});

// --- Types ---
export type GoogleAuthQueryType = z.infer<typeof GoogleAuthQuery>;
export type GoogleSyncBodyType = z.infer<typeof GoogleSyncBody>;
export type GooglePurgeBodyType = z.infer<typeof GooglePurgeBody>;
export type GoogleUnlinkBodyType = z.infer<typeof GoogleUnlinkBody>;
export type GoogleStatusQueryType = z.infer<typeof GoogleStatusQuery>;

export type GoogleSyncResponseType = z.infer<typeof GoogleSyncResponse>;
export type GooglePurgeResponseType = z.infer<typeof GooglePurgeResponse>;
export type GoogleStatusResponseType = z.infer<typeof GoogleStatusResponse>;
