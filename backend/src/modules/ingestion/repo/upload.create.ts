import { UploadMetadata } from '../types';

// Simulated database
const uploadsDB = new Map<string, UploadMetadata>();

/**
 * Create upload record in database
 * SQL: INSERT INTO uploads (uploadId, userId, ...) VALUES (?, ?, ...)
 * 
 * @param metadata - Upload information
 * @returns Created upload record
 */
export async function createUpload(
  metadata: UploadMetadata
): Promise<UploadMetadata> {
  uploadsDB.set(metadata.uploadId, metadata);
  return metadata;
}

/**
 * Get upload by ID
 * SQL: SELECT * FROM uploads WHERE uploadId = ?
 */
export async function getUploadById(
  uploadId: string
): Promise<UploadMetadata | null> {
  return uploadsDB.get(uploadId) || null;
}

/**
 * Update upload status
 * SQL: UPDATE uploads SET status = ? WHERE uploadId = ?
 */
export async function updateUploadStatus(
  uploadId: string,
  status: UploadMetadata['status']
): Promise<void> {
  const upload = uploadsDB.get(uploadId);
  if (upload) {
    upload.status = status;
    uploadsDB.set(uploadId, upload);
  }
}

/**
 * Delete upload record
 * SQL: DELETE FROM uploads WHERE uploadId = ?
 */
export async function deleteUpload(uploadId: string): Promise<boolean> {
  return uploadsDB.delete(uploadId);
}

/**
 * Get expired uploads for cleanup
 * SQL: SELECT * FROM uploads WHERE expiresAt < NOW() AND status = 'pending'
 */
export async function getExpiredUploads(): Promise<UploadMetadata[]> {
  const now = new Date();
  return Array.from(uploadsDB.values()).filter(
    upload => upload.expiresAt < now && upload.status === 'pending'
  );
}