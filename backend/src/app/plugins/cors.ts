import fp from "fastify-plugin";
import cors from "@fastify/cors";

/**
 * CORS plugin with allowlist.
 * - Accepts requests with no Origin (e.g., curl/Postman).
 */
export default fp(async (app) => {
  await app.register(cors, {
    origin: (origin, cb) => {
      // Parse allowlist once per call
      const allowlist = (process.env.CORS_ALLOWLIST ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // No origin => non-browser client; allow.
      if (!origin) return cb(null, true);

      // Empty allowlist => allow everything 
      if (allowlist.length === 0) return cb(null, true);

      // Exact match check; 
      if (allowlist.includes(origin)) return cb(null, true);

      cb(new Error("Origin not allowed by CORS allowlist"), false);
    },
    credentials: true, // allow cookies/Authorization header
  });
});
