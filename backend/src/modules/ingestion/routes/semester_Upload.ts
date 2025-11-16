// src/modules/ingestion/routes/semester_Upload.ts
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../../auth/svc/auth.guard";
import { SemesterCalendarService } from "../svc/semester_Calendar_Service";

const Q = z.object({
  semesterKey: z.string().min(1),
  academicYear: z.string().optional(),
  defaultYear: z.coerce.number().int().optional(),
  altYear: z.coerce.number().int().optional(),
});

export default async function semesterUploadRoute(app: FastifyInstance) {
  const svc = new SemesterCalendarService();

  app.post(
    "/semester-calendar/upload",
    { preHandler: requireAuth },
    async (req, reply) => {
      const studentId = (req as any).user?.sub as string | undefined;
      if (!studentId) {
        return reply.code(401).send({ title: "Unauthorized", status: 401 });
      }

      const file = await (req as any).file?.();
      if (!file) {
        return reply.code(400).send({ title: "Bad Request", status: 400, detail: "file is required" });
      }
      if (file.file.truncated) {
        return reply.code(413).send({ title: "Payload Too Large", status: 413 });
      }

      // parse query or fallback to header
      const qParsed = Q.safeParse((req as any).query ?? {});
      let params: z.infer<typeof Q>;
      if (qParsed.success) {
        params = qParsed.data;
      } else {
        const headerKey = (req.headers["x-semester-key"] as string | undefined)?.trim();
        if (!headerKey) {
          return reply.code(400).send({
            title: "Bad Request",
            status: 400,
            detail: "semesterKey is required (query ?semesterKey=… or header x-semester-key).",
          });
        }
        params = { semesterKey: headerKey };
      }

      const buffer = await file.toBuffer();
      const result = await svc.uploadAndParse({
        semesterKey: params.semesterKey,
        academicYear: params.academicYear,
        defaultYear: params.defaultYear,
        altYear: params.altYear,
        studentId,
        originalFilename: file.filename,
        mimeType: file.mimetype,
        buffer,
      });

      return reply.send(result);
    }
  );
}
