import { FastifyReply } from "fastify";

/**
 * RFC7807 Problem Details helpers.
 * Use sendProblem(reply, Problem) to return standardized error payloads.
 */
export type Problem = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [k: string]: any;
};

export function sendProblem(reply: FastifyReply, p: Problem) {
  return reply
    .code(p.status)
    .type("application/problem+json")
    .send({ type: p.type ?? "about:blank", ...p });
}

// Shortcut constructors for common HTTP errors
export const BadRequest = (detail?: string): Problem => ({ title: "Bad Request", status: 400, detail });
export const Unauthorized = (detail?: string): Problem => ({ title: "Unauthorized", status: 401, detail });
export const Forbidden = (detail?: string): Problem => ({ title: "Forbidden", status: 403, detail });
export const NotFound = (detail?: string): Problem => ({ title: "Not Found", status: 404, detail });
export const Conflict = (detail?: string): Problem => ({ title: "Conflict", status: 409, detail });
export const TooManyRequests = (detail?: string): Problem => ({ title: "Too Many Requests", status: 429, detail });
export const ServerError = (detail?: string): Problem => ({ title: "Internal Server Error", status: 500, detail });
