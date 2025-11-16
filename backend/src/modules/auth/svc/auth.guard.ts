import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../../core/config/env";

/**
 * Extends FastifyRequest with a typed `user` payload.
 * You can add more fields if you put them into the JWT (e.g., role).
 */
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;          // user id
      email?: string;       
      typ?: string;         // "access"
      iss?: string;
      aud?: string;
      [k: string]: any;
    };
  }
}

/**
 * Require a valid **access** token.
 * - Accepts `Authorization: Bearer <token>` header (preferred)
 * - Falls back to cookies: `accessToken` or `access_token`
 * - Verifies iss/aud and typ === "access"
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  // 1) Pull token from header or cookie
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  const cookieToken =
    // @ts-ignore (fastify-cookie adds `cookies`)
    (req.cookies?.accessToken as string | undefined) ??
    // @ts-ignore
    (req.cookies?.access_token as string | undefined);

  const token = bearer || cookieToken;
  if (!token) {
    return reply.code(401).send({ message: "Missing access token" });
  }

  try {
    // 2) Verify using Fastify's JWT instance
    const payload = (await req.server.jwt.verify(token)) as Record<string, any>;

    // 3) Hard-check standard claims
    if (payload.iss && payload.iss !== env.JWT_ISSUER) {
      return reply.code(401).send({ message: "Invalid token issuer" });
    }
    if (payload.aud && payload.aud !== env.JWT_AUDIENCE) {
      return reply.code(401).send({ message: "Invalid token audience" });
    }
    if (payload.typ !== "access") {
      return reply.code(401).send({ message: "Invalid token type" });
    }
    if (!payload.sub) {
      return reply.code(401).send({ message: "Invalid token subject" });
    }

    // 4) Attach to request for downstream handlers
    req.user = {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      typ: payload.typ,
      iss: payload.iss,
      aud: payload.aud,
      ...payload, // keep other safe fields if you add them (e.g., role)
    };
  } catch {
    return reply.code(401).send({ message: "Invalid or expired token" });
  }
}
