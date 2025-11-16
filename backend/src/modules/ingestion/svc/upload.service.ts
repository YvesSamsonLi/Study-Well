import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { UploadMetadata, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../types.ts';
import { createUpload, updateUploadStatus, getUploadById } from '../repo/upload.create.ts';

/**
 * Upload service handles file validation, storage, and metadata management
 */
export class UploadService {
  private tempDir: string;

  constructor(tempDir: string = './tmp/uploads') {
    this.tempDir = tempDir;
  }

  /**
   * Initialize service - ensure temp directory exists
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
      throw error;
    }
  }

  /**
   * Process uploaded file
   * Steps:
   * 1. Validate file type and size
   * 2. Generate unique upload ID
   * 3. Save file to temp storage
   * 4. Create metadata record
   * 5. Schedule cleanup
   */
  async processUpload(
    userId: string,
    filename: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<UploadMetadata> {
    // Step 1: Validate file type
    if (!this.isAllowedMimeType(mimeType)) {
      throw new Error(
        `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Step 1b: Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${fileBuffer.length} bytes. Maximum: ${MAX_FILE_SIZE} bytes`
      );
    }

    // Step 2: Generate unique upload ID
    const uploadId = this.generateUploadId();

    // Step 3: Save to temp storage
    const fileExtension = this.getFileExtension(filename);
    const tempFilename = `${uploadId}${fileExtension}`;
    const tempPath = path.join(this.tempDir, tempFilename);

    await fs.writeFile(tempPath, fileBuffer);
    console.log(`File saved to temp storage: ${tempPath}`);

    // Step 4: Create metadata record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const metadata: UploadMetadata = {
      uploadId,
      userId,
      originalFilename: filename,
      mimeType,
      fileSize: fileBuffer.length,
      tempPath,
      uploadedAt: now,
      expiresAt,
      status: 'pending'
    };

    await createUpload(metadata);

    // Step 5: Schedule cleanup (in production, use cron job or scheduler)
    this.scheduleCleanup(uploadId, expiresAt);

    return metadata;
  }

  /**
   * Get upload metadata by ID
   */
  async getUpload(uploadId: string): Promise<UploadMetadata | null> {
    return getUploadById(uploadId);
  }

  /**
   * Update upload processing status
   */
  async updateStatus(
    uploadId: string,
    status: UploadMetadata['status']
  ): Promise<void> {
    await updateUploadStatus(uploadId, status);
  }

  /**
   * Delete temp file and metadata
   */
  async deleteUpload(uploadId: string): Promise<void> {
    const upload = await getUploadById(uploadId);
    if (!upload) return;

    // Delete physical file
    try {
      await fs.unlink(upload.tempPath);
      console.log(`Deleted temp file: ${upload.tempPath}`);
    } catch (error) {
      console.error(`Failed to delete file: ${upload.tempPath}`, error);
    }

    // Delete metadata
    const { deleteUpload: deleteUploadRecord } = await import('../repo/upload.create.ts');
    await deleteUploadRecord(uploadId);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Check if MIME type is allowed
   */
  private isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType as any);
  }

  /**
   * Generate unique upload ID
   * Format: upl_<timestamp>_<random>
   */
  private generateUploadId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `upl_${timestamp}_${random}`;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const ext = path.extname(filename);
    return ext || '.bin';
  }

  /**
   * Schedule automatic cleanup of expired files
   * In production, use a proper job scheduler (Bull, node-cron, etc.)
   */
  private scheduleCleanup(uploadId: string, expiresAt: Date): void {
    const delay = expiresAt.getTime() - Date.now();
    
    // Don't schedule if already expired
    if (delay <= 0) return;

    setTimeout(async () => {
      console.log(`Cleaning up expired upload: ${uploadId}`);
      await this.deleteUpload(uploadId);
    }, delay);
  }

  /**
   * Clean up all expired uploads (called by cron job)
   */
  async cleanupExpired(): Promise<void> {
    const { getExpiredUploads } = await import('../repo/upload.create.ts');
    const expired = await getExpiredUploads();
    
    console.log(`Cleaning up ${expired.length} expired uploads`);
    
    for (const upload of expired) {
      await this.deleteUpload(upload.uploadId);
    }
  }
}