import { FastifyReply, FastifyRequest } from "fastify";
import { Forbidden, sendProblem } from "./errors";

/** Require that JWT contains at least one of the given scopes. */
export function requireScope(...scopes: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = (req.user ?? {}) as { scope?: string | string[] };
    const have = Array.isArray(token.scope) ? token.scope : (token.scope ? [token.scope] : []);
    if (!scopes.some(s => have.includes(s))) {
      return sendProblem(reply, Forbidden("Insufficient scope"));
    }
  };
}
