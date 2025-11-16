import { FastifyReply, FastifyRequest } from "fastify";
import { Unauthorized, sendProblem } from "./errors";
import { env } from "../config/env";

const ISS = env.JWT_ISSUER;
const AUD = env.JWT_AUDIENCE;

/**
 * Require a valid ACCESS token (iss/aud checked, typ === "access").
 */
export async function requireAccessAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await req.jwtVerify({ allowedIss: ISS, allowedAud: AUD });
    if ((decoded as any).typ !== "access") throw new Error("wrong token type");
  } catch {
    return sendProblem(reply, Unauthorized("Invalid or missing access token"));
  }
}

/**
 * Require a valid REFRESH token (iss/aud checked, typ === "refresh").
 */
export async function requireRefreshAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await req.jwtVerify({ allowedIss: ISS, allowedAud: AUD });
    if ((decoded as any).typ !== "refresh") throw new Error("wrong token type");
  } catch {
    return sendProblem(reply, Unauthorized("Invalid or missing refresh token"));
  }
}
