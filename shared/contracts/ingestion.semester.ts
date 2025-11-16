// Zod contracts for SemesterCalendarService

import { z } from "zod";

/** Upload (PDF/ICS/CSV) → parse → upsert → materialize */
export const SemesterUploadQuery = z.object({
  semesterKey: z.string().min(1), // cuid OR "AY25/26 Sem 1" OR "AY25S1"
  academicYear: z.string().optional(), // e.g. "AY25/26"
  defaultYear: z.coerce.number().optional(),
  altYear: z.coerce.number().optional(),
});

export const SemesterUploadMeta = z.object({
  studentId: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
});

export const SemesterParsedSummary = z.object({
  classes: z.number().int().nonnegative(),
  courses: z.number().int().nonnegative(),
});

export const SemesterUploadResponse = z.object({
  fileId: z.string(),
  semesterId: z.string(),
  parsedSummary: SemesterParsedSummary,
  materialized: z.object({ ok: z.boolean() }),
});

export type SemesterUploadQueryDTO = z.infer<typeof SemesterUploadQuery>;
export type SemesterUploadMetaDTO  = z.infer<typeof SemesterUploadMeta>;
export type SemesterUploadRespDTO  = z.infer<typeof SemesterUploadResponse>;

/** Server expects multipart/form-data with:
 *  - file (Blob)
 *  - meta (JSON string of SemesterUploadMetaDTO)
 *  - query params from SemesterUploadQueryDTO
 */
export const SemesterMultipartFields = {
  fileField: "file",
  metaField: "meta",
} as const;
