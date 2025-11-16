import fp from "fastify-plugin";
import fastifyJwt, { type FastifyJWTOptions } from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { env, getJwtConfig } from "../../core/config/env";

/**
 * JWT plugin:
 * - HS256 when JWT_SECRET is provided
 * - Asymmetric when JWT_PRIVATE_KEY + JWT_PUBLIC_KEY are provided
 */
const jwtPlugin: FastifyPluginAsync = async (app) => {
  const normalizePem = (s?: string) => (s ? s.replace(/\\n/g, "\n") : s);

  const cfg = getJwtConfig(); // ensures one valid mode and non-undefined secrets
  let opts: FastifyJWTOptions;

  if (cfg.mode === "secret") {
    // HMAC (HS256) — NOTE: set iss/aud/exp when signing tokens (see below).
    const secret = cfg.secret as string; // narrow to satisfy types
    opts = { secret };
  } else {
    // Asymmetric (EdDSA by default). For RSA, change algorithm to 'RS256'.
    opts = {
      secret: {
        private: normalizePem(cfg.privateKey)!,
        public: normalizePem(cfg.publicKey)!,
      },
      sign: {
        algorithm: "EdDSA",
      },
      verify: {
        algorithms: ["EdDSA"],
      },
    };
  }

  await app.register(fastifyJwt, opts);

  // Decorate an auth guard (typed)
  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        request.log.warn({ err }, "JWT verify failed");
        reply.code(401).send({ message: "Unauthorized" });
      }
    }
  );
};

export default fp(jwtPlugin);
