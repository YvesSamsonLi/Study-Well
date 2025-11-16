import { FastifyInstance } from "fastify";
import registerAcademicCalendarUpload from "./academic_Upload";
import registerSemesterUpload from "./semester_Upload";
import { requireAuth } from "../../auth/svc/auth.guard"; // align with your auth guard

export default async function registerIngestionRoutes(app: FastifyInstance) {
  await app.register(async (r) => {
    r.addHook("preHandler", requireAuth);
    await registerAcademicCalendarUpload(r);
    await registerSemesterUpload(r);   
  });        
}
