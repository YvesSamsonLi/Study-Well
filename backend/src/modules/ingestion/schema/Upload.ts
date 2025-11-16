import { z } from "zod";

export const UploadStatusZ = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export type UploadStatus = z.infer<typeof UploadStatusZ>;

export interface UploadMetadata {
  uploadId: string;
  userId: string;
  originalFilename: string;
  mimeType: (typeof ALLOWED_MIME_TYPES)[number] | string;
  fileSize: number;
  tempPath: string;
  uploadedAt: Date;
  expiresAt: Date;
  status: UploadStatus;
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
] as const;
