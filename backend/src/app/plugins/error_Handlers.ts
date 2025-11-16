import fp from "fastify-plugin";
import { ZodError, type ZodIssue } from "zod";
// Import Prisma runtime error class directly (works across Prisma versions)
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendProblem, BadRequest, ServerError, Conflict, NotFound } from "../../core/http/errors";

function isPrismaKnownError(e: unknown): e is PrismaClientKnownRequestError {
  return e instanceof PrismaClientKnownRequestError;
}

/** Converts Zod/Prisma errors into RFC7807 consistently. */
export default fp(async (app) => {
  app.setErrorHandler((err, req, reply) => {
    // Zod -> 400 with aggregated details
    if (err instanceof ZodError) {
      const detail = err.issues
        .map((i: ZodIssue) => `${(i.path || []).join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      return sendProblem(reply, BadRequest(detail));
    }

    // Prisma known request errors (e.g., unique violation, not found)
    if (isPrismaKnownError(err)) {
      if (err.code === "P2002") return sendProblem(reply, Conflict("Unique constraint violated"));
      if (err.code === "P2025") return sendProblem(reply, NotFound("Record not found"));
    }

    // Fallback -> 500
    req.log.error({ err }, "unhandled error");
    return sendProblem(reply, ServerError());
  });
});
