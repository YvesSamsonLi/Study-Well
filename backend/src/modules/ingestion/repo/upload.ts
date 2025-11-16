import { prisma } from "../../../core/db/prisma";
import { UploadMetadata, UploadStatus } from "../schema/Upload";

/** Create upload record */
export async function createUploadRepo(
  metadata: UploadMetadata
): Promise<UploadMetadata> {
  const created = await prisma.upload.create({
    data: {
      id: metadata.uploadId,
      userId: metadata.userId,
      originalFilename: metadata.originalFilename,
      mimeType: metadata.mimeType,
      fileSize: metadata.fileSize,
      tempPath: metadata.tempPath,
      uploadedAt: metadata.uploadedAt,
      expiresAt: metadata.expiresAt,
      status: metadata.status as any,
    },
  });

  return mapRecord(created);
}

/** Get single upload by id */
export async function getUploadByIdRepo(
  uploadId: string
): Promise<UploadMetadata | null> {
  const r = await prisma.upload.findUnique({ where: { id: uploadId } });
  return r ? mapRecord(r) : null;
}

/** Delete upload; returns true if deleted */
export async function deleteUploadRepo(uploadId: string): Promise<boolean> {
  try {
    await prisma.upload.delete({ where: { id: uploadId } });
    return true;
  } catch {
    return false;
  }
}

/** Get all expired 'pending' uploads (for cleanup) */
export async function getExpiredUploadsRepo(): Promise<UploadMetadata[]> {
  const now = new Date();
  const rows = await prisma.upload.findMany({
    where: { expiresAt: { lt: now }, status: "pending" as any },
  });
  return rows.map(mapRecord);
}

/** Update upload status */
export async function updateUploadStatusRepo(
  uploadId: string,
  status: UploadStatus
): Promise<void> {
  await prisma.upload.update({ where: { id: uploadId }, data: { status } });
}

/** List uploads with pagination/filter */
export async function listUploadsRepo(params: {
  status?: UploadStatus;
  page?: number;
  limit?: number;
  userId?: string; 
}): Promise<{ items: UploadMetadata[]; total: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const where: any = {};
  if (params.status) where.status = params.status;
  if (params.userId) where.userId = params.userId;

  const [total, rows] = await Promise.all([
    prisma.upload.count({ where }),
    prisma.upload.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items: rows.map(mapRecord), total };
}

function mapRecord(r: any): UploadMetadata {
  return {
    uploadId: r.id,
    userId: r.userId,
    originalFilename: r.originalFilename,
    mimeType: r.mimeType,
    fileSize: r.fileSize,
    tempPath: r.tempPath,
    uploadedAt: r.uploadedAt,
    expiresAt: r.expiresAt,
    status: r.status,
  };
}
