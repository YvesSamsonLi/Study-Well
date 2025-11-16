import "@fastify/jwt";

/**
 * Augment FastifyJWT types so TypeScript knows about:
 * - the shape of req.user (after jwtVerify)
 * - the payload we sign/verify
 */
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; jti: string; typ: "access" | "refresh" };
    user:    { sub: string; jti: string; typ: "access" | "refresh" };
  }
}
