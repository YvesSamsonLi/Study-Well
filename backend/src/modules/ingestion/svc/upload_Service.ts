import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { MultipartFile } from "@fastify/multipart";

import {
  UploadMetadata,
  ALLOWED_MIME_TYPES,
  UploadStatus,
} from "../schema/Upload";
import {
  createUploadRepo,
  deleteUploadRepo,
  getExpiredUploadsRepo,
  getUploadByIdRepo,
  listUploadsRepo,
  updateUploadStatusRepo,
} from "../repo/upload.repo";

/**
 * Generic Upload Service:
 * - validates type
 * - writes to temp dir
 * - persists Upload metadata (Prisma Upload model)
 * - cleanup helpers
 */
export class UploadService {
  constructor(private tempDir: string = "./tmp/uploads") {}

  async initialize(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /** Main entry for binary uploads (already in memory) */
  async processUpload(
    userId: string,
    filename: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<UploadMetadata> {
    if (!this.isAllowedMimeType(mimeType)) {
      throw new Error(
        `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    const uploadId = this.generateUploadId();
    const ext = this.getFileExtension(filename);
    const tempFilename = `${uploadId}${ext}`;
    const tempPath = path.join(this.tempDir, tempFilename);

    await fs.writeFile(tempPath, fileBuffer);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    const meta: UploadMetadata = {
      uploadId,
      userId,
      originalFilename: filename,
      mimeType,
      fileSize: fileBuffer.length,
      tempPath,
      uploadedAt: now,
      expiresAt,
      status: "pending",
    };

    await createUploadRepo(meta);
    this.scheduleCleanup(uploadId, expiresAt);
    return meta;
  }

  /** Convenience for multipart */
  async createFromMultipart(file: MultipartFile, userId = "system") {
    const buffer = await file.toBuffer();
    return this.processUpload(userId, file.filename, file.mimetype, buffer);
  }

  async getUpload(uploadId: string) {
    return getUploadByIdRepo(uploadId);
  }

  async updateStatus(uploadId: string, status: UploadStatus) {
    await updateUploadStatusRepo(uploadId, status);
  }

  async deleteUpload(uploadId: string) {
    const rec = await getUploadByIdRepo(uploadId);
    if (rec) {
      try {
        await fs.unlink(rec.tempPath);
      } catch {
        // ignore missing file
      }
    }
    await deleteUploadRepo(uploadId);
  }

  async listUploads(options: {
    status?: UploadStatus;
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    return listUploadsRepo(options);
  }

  async cleanupExpired() {
    const expired = await getExpiredUploadsRepo();
    for (const u of expired) {
      await this.deleteUpload(u.uploadId);
    }
  }

  // ---------- private helpers ----------
  private isAllowedMimeType(m: string) {
    return ALLOWED_MIME_TYPES.includes(m as any);
  }

  private generateUploadId() {
    const ts = Date.now();
    const rand = crypto.randomBytes(8).toString("hex");
    return `upl_${ts}_${rand}`;
  }

  private getFileExtension(filename: string) {
    const ext = path.extname(filename);
    return ext || ".bin";
  }

  private scheduleCleanup(uploadId: string, expiresAt: Date) {
    const delay = expiresAt.getTime() - Date.now();
    if (delay <= 0) return;
    setTimeout(() => this.deleteUpload(uploadId).catch(() => {}), delay);
  }
}
