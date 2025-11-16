// Zod contracts for AcademicCalendarService (academic dates like recess, exams)

import { z } from "zod";

export const AcademicUploadQuery = z.object({
  semesterKey: z.string().min(1), // same resolution as Semester service
});

export const AcademicUploadMeta = z.object({
  uploaderId: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
});

export const AcademicUploadResponse = z.object({
  fileId: z.string(),
  semesterId: z.string(),
  extracted: z.object({
    ayShort: z.string().nullable().optional(), // e.g. "25/26"
    terms: z.array(
      z.object({
        code: z.string(),        // "AY25S1"
        name: z.string(),        // "AY25/26 Sem 1"
        startDate: z.string(),   // ISO
        endDate: z.string(),     // ISO
      })
    ).optional(),
  }).optional(),
});

export type AcademicUploadQueryDTO = z.infer<typeof AcademicUploadQuery>;
export type AcademicUploadMetaDTO  = z.infer<typeof AcademicUploadMeta>;
export type AcademicUploadRespDTO  = z.infer<typeof AcademicUploadResponse>;

export const AcademicMultipartFields = {
  fileField: "file",
  metaField: "meta",
} as const;
