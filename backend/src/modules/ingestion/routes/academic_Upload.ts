// src/modules/ingestion/routes/academic_Upload.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AcademicCalendarService } from "../svc/academic_Calendar_Service";
import { requireAuth } from "../../auth/svc/auth.guard";

// include semesterKey so strict() won’t reject it
const IngestQuerySchema = z.object({
  semesterKey: z.coerce.string().trim().optional(),   
  semesterId: z.coerce.string().trim().optional(),
  semesterName: z.coerce.string().trim().optional(),
  termId: z.coerce.string().trim().optional(),
  termName: z.coerce.string().trim().optional(),

  academicYear: z.coerce.string().trim().optional(),
  defaultYear: z.coerce.number().int().optional(),
  altYear: z.coerce.number().int().optional(),
}).strict();

export default async function registerAcademicUpload(app: FastifyInstance) {
  const svc = new AcademicCalendarService();

  app.post(
    "/academic-calendar/upload",
    {
      preHandler: requireAuth,
      schema: {
        consumes: ["multipart/form-data"],
        summary: "Upload Academic Calendar (PDF/HTML) and parse to events",
      },
    },
    async (req, reply) => {
      const user = (req as any).user;
      const ownerId: string | undefined = user?.sub;
      if (!ownerId) {
        return reply.code(401).send({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Missing subject in access token",
        });
      }

      const file = await (req as any).file?.();
      if (!file) {
        return reply.code(400).send({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "file is required (multipart/form-data, field name 'file')",
        });
      }
      if (file.file.truncated) {
        return reply.code(413).send({
          type: "about:blank",
          title: "Payload Too Large",
          status: 413,
          detail: "uploaded file exceeded size limit",
        });
      }

      const parsedQuery = IngestQuerySchema.safeParse((req as any).query ?? {});
      if (!parsedQuery.success) {
        return reply.code(400).send({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: parsedQuery.error.issues.map(i => i.message).join("; "),
        });
      }
      const q = parsedQuery.data;

      // Prefer semesterKey if provided, then fall back to the others
      const semesterKey =
        q.semesterKey ||
        q.semesterId ||
        q.semesterName ||
        q.termId ||
        q.termName ||
        undefined;

      try {
        const buffer = await file.toBuffer();

        const result = await svc.uploadAndParse({
          // service expects studentId; map ownerId → studentId
          studentId: ownerId,
          semesterKey,
          academicYear: q.academicYear,
          defaultYear: q.defaultYear,
          altYear: q.altYear,
          originalFilename: file.filename,
          buffer,
          mimeType: file.mimetype,
        });

        return reply.send(result);
      } catch (err: any) {
        const msg = String(err?.message || err);
        if (/(Semester|Student|Owner) not found/i.test(msg)) {
          return reply.code(400).send({
            type: "about:blank",
            title: "Bad Request",
            status: 400,
            detail: msg,
          });
        }
        req.log.error({ err }, "academic upload failed");
        return reply.code(500).send({
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
        });
      }
    }
  );
}
