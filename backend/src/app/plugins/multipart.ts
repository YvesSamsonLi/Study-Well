import fp from "fastify-plugin";
import multipart from "@fastify/multipart";

/**
 * Multipart/form-data plugin for uploads.
 * Limits:
 *  - Max file size: 10MB
 *  - Max files per request: 2
 */
export default fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 2,
    },
  });
});
