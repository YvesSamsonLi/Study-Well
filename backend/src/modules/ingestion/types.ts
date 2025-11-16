/**
 * Upload metadata stored after file is uploaded
 */
export interface UploadMetadata {
  uploadId: string;          // Unique upload identifier
  userId: string;            // User who uploaded the file
  originalFilename: string;  // Original filename from client
  mimeType: string;          // File MIME type (e.g., 'application/pdf')
  fileSize: number;          // File size in bytes
  tempPath: string;          // Temporary file storage path
  uploadedAt: Date;          // Upload timestamp
  expiresAt: Date;           // When temp file will be deleted
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Allowed file types for upload
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB