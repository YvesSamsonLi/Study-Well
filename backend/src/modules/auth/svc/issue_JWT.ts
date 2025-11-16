import { FastifyInstance } from "fastify";
import { env } from "../../../core/config/env";

const ISS = env.JWT_ISSUER;
const AUD = env.JWT_AUDIENCE;

/** Short-lived access token with standard claims */
export function issueAccess(app: FastifyInstance, sub: string, extra?: Record<string, any>) {
  return app.jwt.sign(
    { sub, iss: ISS, aud: AUD, typ: "access", ...extra },
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

/** Refresh token carries JTI + standard claims */
export function issueRefresh(app: FastifyInstance, sub: string, jti: string) {
  return app.jwt.sign(
    { sub, jti, iss: ISS, aud: AUD, typ: "refresh" },
    { expiresIn: env.JWT_REFRESH_TTL }
  );
}
