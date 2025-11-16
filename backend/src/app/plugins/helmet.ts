import fp from "fastify-plugin";
import helmet from "@fastify/helmet";

/** Safe API defaults; no HTML here, so disable CSP to avoid surprises. */
export default fp(async (app) => {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // safe for APIs that might serve files
  });
});
