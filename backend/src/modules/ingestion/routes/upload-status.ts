import { FastifyInstance } from 'fastify';
import { requireAccessAuth } from "../../../core/http/guard";
import { NotFound, sendProblem } from '../../../core/http/errors';
import { UploadService } from '../svc/upload.service.ts';

const uploadService = new UploadService();

/**
 * GET /ingestion/upload/:uploadId
 * 
 * Check status of an upload
 * 
 * Response:
 * {
 *   "uploadId": "upl_1234567890_abc123",
 *   "status": "processing",
 *   "filename": "document.pdf",
 *   "size": 123456,
 *   "uploadedAt": "2024-10-15T10:30:00Z"
 * }
 */
export default async function (app: FastifyInstance) {
  app.get(
    '/ingestion/upload/:uploadId',
    { preHandler: requireAccessAuth },
    async (req, reply) => {
      const { uploadId } = req.params as { uploadId: string };

      const upload = await uploadService.getUpload(uploadId);

      if (!upload) {
        return sendProblem(reply, NotFound('Upload not found'));
      }

      reply.code(200).send({
        uploadId: upload.uploadId,
        status: upload.status,
        filename: upload.originalFilename,
        size: upload.fileSize,
        uploadedAt: upload.uploadedAt.toISOString(),
        expiresAt: upload.expiresAt.toISOString()
      });
    }
  );
}
